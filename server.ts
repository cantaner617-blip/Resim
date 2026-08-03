import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { createServer as createViteServer } from 'vite';
import { db, pwdUtil } from './server/db';
import { signToken, verifyToken } from './server/token';

const app = express();
const PORT = 3000;

app.use(express.json());

// Cloudinary Configuration
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("Cloudinary successfully configured.");
} else {
  console.warn("Cloudinary configuration missing! Using local database storage fallback for uploaded images.");
}

// Multer storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];

// Auth middleware typings
export interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Bu işlem için giriş yapmalısınız.' });
  }
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }
  req.user = decoded;
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'Giriş yapılmadı.' });
    const userObj = db.getUserById(req.user.id);
    if (!userObj || !userObj.isAdmin) {
      return res.status(403).json({ error: 'Bu işlem için yönetici yetkiniz bulunmamaktadır.' });
    }
    next();
  });
}

// ================= API ENDPOINTS =================

// Local fallback image renderer
app.get('/api/local-images/:id', (req, res) => {
  const image = db.getImageById(req.params.id);
  if (!image || !image.isLocal || !image.localData) {
    return res.status(404).send('Resim bulunamadı.');
  }
  const buffer = Buffer.from(image.localData, 'base64');
  let contentType = 'image/png';
  if (image.format === 'jpeg' || image.format === 'jpg') {
    contentType = 'image/jpeg';
  } else if (image.format === 'gif') {
    contentType = 'image/gif';
  } else if (image.format === 'webp') {
    contentType = 'image/webp';
  } else if (image.format === 'bmp') {
    contentType = 'image/bmp';
  }
  res.set('Content-Type', contentType);
  res.set('Cache-Control', 'public, max-age=31536000');
  res.send(buffer);
});

// Auth API
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı, e-posta ve şifre zorunludur.' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Kullanıcı adı en az 3 karakter olmalıdır.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
  }

  const existingEmail = db.getUserByEmail(email);
  if (existingEmail) {
    return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda.' });
  }

  const existingUsername = db.getUserByUsername(username);
  if (existingUsername) {
    return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış.' });
  }

  const passwordHash = pwdUtil.hash(password);
  const user = db.addUser({
    username,
    email,
    passwordHash
  });

  const token = signToken({ id: user.id, username: user.username });
  res.status(201).json({
    token,
    user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre zorunludur.' });
  }

  const user = db.getUserByEmail(email);
  if (!user || !pwdUtil.verify(password, user.passwordHash)) {
    return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
  }

  const token = signToken({ id: user.id, username: user.username });
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin }
  });
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Giriş yapılmadı' });
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }
  res.json({
    user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin, createdAt: user.createdAt }
  });
});

// Image Upload API
app.post('/api/upload', optionalAuth, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Lütfen yüklenecek bir resim seçin.' });
    }

    // Maintenance Mode Check
    const sysConfig = db.getSystemConfig();
    const userObj = req.user ? db.getUserById(req.user.id) : null;
    const isAdminUser = userObj?.isAdmin === true;

    if (sysConfig.maintenanceMode && !isAdminUser) {
      return res.status(503).json({ error: 'Sistem şu anda bakım modundadır. Lütfen daha sonra tekrar deneyiniz.' });
    }

    // 20MB vs 100MB Upload Limit
    const isLoggedIn = !!req.user;
    const limitBytes = isLoggedIn ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    if (req.file.size > limitBytes) {
      const limitMb = isLoggedIn ? 100 : 20;
      return res.status(400).json({ 
        error: `Maksimum yükleme limitini aştınız! ${isLoggedIn ? 'Üyeler' : 'Ziyaretçiler'} için maksimum limit ${limitMb} MB'dır. ${!isLoggedIn ? 'Hemen ücretsiz üye olarak 100 MB limitine yükseltebilirsiniz!' : ''}`
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Sadece JPG, PNG, GIF, BMP ve WEBP formatları desteklenir.' });
    }

    const fileId = crypto.randomBytes(4).toString('hex'); // 8 char hex string
    const filename = req.file.originalname;
    const format = req.file.mimetype.split('/')[1] || 'png';
    const bytes = req.file.size;

    let imageUrl = '';
    let publicId = '';
    let width = 600;
    let height = 400;

    if (isCloudinaryConfigured) {
      // Stream to Cloudinary
      try {
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'resimyukle',
              public_id: fileId,
              resource_type: 'image',
            },
            (err, res) => {
              if (err) return reject(err);
              resolve(res);
            }
          );
          uploadStream.end(req.file!.buffer);
        });

        imageUrl = result.secure_url;
        publicId = result.public_id;
        width = result.width;
        height = result.height;
      } catch (cloudinaryErr: any) {
        console.error("Cloudinary upload failed, falling back to local database storage...", cloudinaryErr);
        // Fallback internally
        const base64Data = req.file.buffer.toString('base64');
        const siteUrl = process.env.APP_URL || `http://localhost:${PORT}`;
        imageUrl = `${siteUrl}/api/local-images/${fileId}`;

        const record = db.addImage({
          id: fileId,
          userId: req.user ? req.user.id : null,
          url: imageUrl,
          filename,
          format,
          bytes,
          width,
          height,
          isLocal: true,
          localData: base64Data,
        });

        return res.json({
          id: record.id,
          directUrl: record.url,
          pageUrl: `/i/${record.id}`,
          width: record.width,
          height: record.height,
          bytes: record.bytes,
          filename: record.filename,
          isLocalFallback: true
        });
      }
    } else {
      // Local Database Base64 Fallback
      const base64Data = req.file.buffer.toString('base64');
      const siteUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      imageUrl = `${siteUrl}/api/local-images/${fileId}`;

      const record = db.addImage({
        id: fileId,
        userId: req.user ? req.user.id : null,
        url: imageUrl,
        filename,
        format,
        bytes,
        width,
        height,
        isLocal: true,
        localData: base64Data,
      });

      return res.json({
        id: record.id,
        directUrl: record.url,
        pageUrl: `/i/${record.id}`,
        width: record.width,
        height: record.height,
        bytes: record.bytes,
        filename: record.filename,
        isLocalFallback: true
      });
    }

    const record = db.addImage({
      id: fileId,
      userId: req.user ? req.user.id : null,
      url: imageUrl,
      publicId,
      filename,
      format,
      bytes,
      width,
      height,
    });

    res.json({
      id: record.id,
      directUrl: record.url,
      pageUrl: `/i/${record.id}`,
      width: record.width,
      height: record.height,
      bytes: record.bytes,
      filename: record.filename,
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    res.status(500).json({ error: 'Yükleme sırasında teknik bir hata oluştu: ' + err.message });
  }
});

// Single Image Details (increment views)
app.get('/api/images/:id', (req, res) => {
  const image = db.getImageById(req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Resim bulunamadı.' });
  }

  db.incrementImageViews(req.params.id);

  // Exclude localData from response
  const { localData, ...safeImage } = image;
  res.json({
    ...safeImage,
    views: image.views + 1
  });
});

// Authenticated user's images
app.get('/api/images-mine', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Giriş yapılmadı' });
  const list = db.getImagesByUserId(req.user.id);
  // Strip large localData fields
  const safeList = list.map(({ localData, ...img }) => img);
  res.json({ images: safeList });
});

// Delete Image
app.delete('/api/images/:id', requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Giriş yapılmadı' });
  const image = db.getImageById(req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Resim bulunamadı.' });
  }

  if (image.userId !== req.user.id) {
    return res.status(403).json({ error: 'Bu resmi silme yetkiniz bulunmamaktadır.' });
  }

  // If Cloudinary stored, attempt to destroy it
  if (isCloudinaryConfigured && image.publicId) {
    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (cloudinaryErr) {
      console.error('Cloudinary destroy failed:', cloudinaryErr);
    }
  }

  db.deleteImage(req.params.id);
  res.json({ success: true, message: 'Resim başarıyla silindi.' });
});

// System Status Info (checks if Cloudinary is configured to display a helper badge)
app.get('/api/system-status', (req, res) => {
  const sysConfig = db.getSystemConfig();
  res.json({
    isCloudinaryConfigured,
    localFallbackActive: !isCloudinaryConfigured,
    maintenanceMode: sysConfig.maintenanceMode,
    announcement: sysConfig.announcement,
    announcementTemplate: sysConfig.announcementTemplate
  });
});

// System Config (Public GET)
app.get('/api/system-config', (req, res) => {
  res.json(db.getSystemConfig());
});

// Update System Config (Admin POST)
app.post('/api/system-config', requireAdmin, (req: AuthRequest, res) => {
  const { maintenanceMode, announcement, announcementTemplate } = req.body;
  const updated = db.updateSystemConfig({
    maintenanceMode: maintenanceMode === true,
    announcement: announcement === undefined ? null : announcement,
    announcementTemplate: announcementTemplate === undefined ? null : announcementTemplate
  });
  res.json(updated);
});

// Admin All Images list (Admin GET)
app.get('/api/admin/images', requireAdmin, (req: AuthRequest, res) => {
  const images = db.getImages();
  const safeImages = images.map(({ localData, ...img }) => img);
  res.json({ images: safeImages });
});

// Admin Delete Image (Admin DELETE)
app.delete('/api/admin/images/:id', requireAdmin, async (req: AuthRequest, res) => {
  const image = db.getImageById(req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Resim bulunamadı.' });
  }

  if (isCloudinaryConfigured && image.publicId) {
    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (cloudinaryErr) {
      console.error('Cloudinary destroy failed in admin delete:', cloudinaryErr);
    }
  }

  db.deleteImage(req.params.id);
  res.json({ success: true, message: 'Resim yönetici tarafından başarıyla silindi.' });
});

// ================= VITE OR STATIC SERVING =================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log("Vite dev server mounted as middleware.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production static files server mounted.");
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});
