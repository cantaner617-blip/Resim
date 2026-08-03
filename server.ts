import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { v2 as cloudinary } from 'cloudinary';
import { createServer as createViteServer } from 'vite';
import { db, pwdUtil } from './server/db';
import { signToken, verifyToken } from './server/token';

const app = express();

// In-memory verification codes storage for password reset
// Key: email (lowercased), Value: { code: string, expiresAt: number }
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  const smtpUser = process.env.SMTP_USER || 'angfs777@gmail.com';
  const smtpPass = process.env.SMTP_PASS || 'xejjbvwkznsxvpaa';
  const cleanPass = smtpPass.replace(/\s+/g, '');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: cleanPass
    }
  });

  const mailOptions = {
    from: `"AnındaResim" <${smtpUser}>`,
    to: email,
    subject: 'Şifre Sıfırlama Doğrulama Kodu - AnındaResim',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border-radius: 16px; background-color: #0b0f19; color: #f3f4f6; border: 1px solid #1f2937;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #2dd4bf; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Anında<span style="color: #ffffff;">Resim</span></h2>
          <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; font-weight: 700;">Hızlı & Güvenli Görsel Paylaşım</p>
        </div>
        
        <div style="background-color: #111827; border-radius: 12px; padding: 20px; border: 1px solid #374151; margin-bottom: 25px; text-align: center;">
          <p style="margin-top: 0; font-size: 14px; color: #d1d5db; text-align: left;">Merhaba,</p>
          <p style="font-size: 14px; color: #9ca3af; line-height: 1.6; text-align: left;">Şifrenizi sıfırlamak için talepte bulundunuz. Aşağıdaki 6 haneli doğrulama kodunu kullanarak yeni şifrenizi belirleyebilirsiniz:</p>
          
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #2dd4bf; background-color: #090d16; border: 1px solid rgba(45, 212, 191, 0.2); padding: 12px 24px; border-radius: 8px; margin: 20px 0; display: inline-block; font-family: monospace;">
            ${code}
          </div>
          
          <p style="font-size: 12px; color: #ef4444; font-weight: 600; margin-bottom: 0;">Bu kod 10 dakika süreyle geçerlidir.</p>
        </div>
        
        <p style="font-size: 11px; color: #6b7280; text-align: center; line-height: 1.5; margin: 0;">Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayınız. Güvenliğiniz için kodunuzu kimseyle paylaşmayınız.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Verification email send error:", error);
    return false;
  }
}
const PORT = Number(process.env.PORT) || 3000;

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

  // Check if image is expired on-the-fly
  const now = new Date().toISOString();
  if (image.expiresAt && image.expiresAt <= now) {
    db.deleteImage(image.id);
    return res.status(404).send('Resim bulunamadı veya süresi doldu.');
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

  // If the image is temporary/has an expiration, disable caching completely
  if (image.expiresAt) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  } else {
    res.set('Cache-Control', 'public, max-age=31536000');
  }

  res.send(buffer);
});

// Universal Direct Image Proxy (Handles local and Cloudinary, with strict on-the-fly expiration check)
app.get('/api/direct-image/:id', async (req, res) => {
  try {
    const image = db.getImageById(req.params.id);
    if (!image) {
      return res.status(404).send('Resim bulunamadı.');
    }

    // Check if image is expired on-the-fly
    const now = new Date().toISOString();
    if (image.expiresAt && image.expiresAt <= now) {
      if (isCloudinaryConfigured && image.publicId) {
        cloudinary.uploader.destroy(image.publicId).catch((err: any) => {
          console.error(`Failed to destroy expired Cloudinary asset for image ${image.id} on direct access:`, err);
        });
      }
      db.deleteImage(image.id);
      return res.status(404).send('Resim bulunamadı veya süresi doldu.');
    }

    // Disable caching entirely for temporary/self-destructing images to prevent browser/CDN caching
    if (image.expiresAt) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else {
      res.set('Cache-Control', 'public, max-age=31536000');
    }

    // Determine content type
    let contentType = 'image/png';
    const fmt = (image.format || '').toLowerCase();
    if (fmt === 'jpeg' || fmt === 'jpg') {
      contentType = 'image/jpeg';
    } else if (fmt === 'gif') {
      contentType = 'image/gif';
    } else if (fmt === 'webp') {
      contentType = 'image/webp';
    } else if (fmt === 'bmp') {
      contentType = 'image/bmp';
    }

    res.set('Content-Type', contentType);

    // If local, serve from local database data
    if (image.isLocal && image.localData) {
      const buffer = Buffer.from(image.localData, 'base64');
      return res.send(buffer);
    }

    // If Cloudinary, proxy fetch the image stream so that the raw Cloudinary link is completely private
    if (image.url) {
      try {
        const response = await fetch(image.url);
        if (!response.ok) {
          // If proxy fetch fails, try to redirect as absolute fallback
          return res.redirect(image.url);
        }
        
        const responseContentType = response.headers.get('content-type');
        if (responseContentType) {
          res.set('Content-Type', responseContentType);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return res.send(buffer);
      } catch (proxyErr) {
        console.error(`Proxy fetch failed for image ${image.id}, redirecting to source url:`, proxyErr);
        return res.redirect(image.url);
      }
    }

    return res.status(404).send('Resim bulunamadı.');
  } catch (err: any) {
    console.error("Direct image proxy error:", err);
    res.status(500).send('Resim yüklenirken bir sunucu hatası oluştu.');
  }
});

// Auth API
app.post('/api/auth/register', (req, res) => {
  try {
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
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message || 'Kayıt işlemi gerçekleştirilirken sunucu tarafında bir hata oluştu.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
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
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message || 'Giriş işlemi gerçekleştirilirken sunucu tarafında bir hata oluştu.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'E-posta adresi zorunludur.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Bu e-posta adresine kayıtlı bir kullanıcı bulunamadı.' });
    }

    // Generate a secure 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    verificationCodes.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    console.log(`Sending verification code ${code} to ${email}...`);
    const isSent = await sendVerificationCode(email, code);

    if (!isSent) {
      return res.status(500).json({ error: 'Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyiniz.' });
    }

    res.json({ message: '6 haneli doğrulama kodu e-posta adresinize gönderildi.' });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: 'Şifre sıfırlama işlemi başlatılırken bir sunucu hatası oluştu.' });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'E-posta, doğrulama kodu ve yeni şifre alanları zorunludur.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
    }

    const savedRecord = verificationCodes.get(email.toLowerCase());
    if (!savedRecord) {
      return res.status(400).json({ error: 'Lütfen önce şifre sıfırlama talebinde bulununuz.' });
    }

    if (Date.now() > savedRecord.expiresAt) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(400).json({ error: 'Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod isteyin.' });
    }

    if (savedRecord.code !== code.trim()) {
      return res.status(400).json({ error: 'Girdiğiniz doğrulama kodu hatalı.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Hash and update password
    const passwordHash = pwdUtil.hash(newPassword);
    db.updateUserPassword(user.id, passwordHash);

    // Clean up code
    verificationCodes.delete(email.toLowerCase());

    res.json({ message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' });
  } catch (err: any) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: 'Şifre sıfırlanırken bir sunucu hatası oluştu.' });
  }
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

    // Guest Upload Limit Check
    const isLoggedIn = !!req.user;
    let guestId = '';
    if (!isLoggedIn) {
      guestId = (req.headers['x-guest-uuid'] as string) || '';
      if (!guestId) {
        guestId = crypto.createHash('sha256').update(req.ip || 'unknown-ip').digest('hex');
      }
      const allowedLimit = sysConfig.guestUploadLimit !== undefined ? sysConfig.guestUploadLimit : 5;
      const currentGuestCount = db.getGuestUploadCount(guestId);
      if (currentGuestCount >= allowedLimit) {
        return res.status(400).json({
          error: `Misafir yükleme limitine ulaştınız! Misafir olarak en fazla ${allowedLimit} resim yükleyebilirsiniz. Hemen ücretsiz kayıt olarak sınırsız yüklemeye başlayın!`,
          limitReached: true,
          limit: allowedLimit
        });
      }
    }

    // 20MB vs 100MB Upload Limit
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

    // Self-destruct time calculation
    const deleteAfter = req.body.deleteAfter; // '5m', '1h', '1d', '7d', 'never'
    let expiresAt: string | null = null;
    if (deleteAfter && deleteAfter !== 'never') {
      const now = new Date();
      if (deleteAfter === '5m') {
        now.setMinutes(now.getMinutes() + 5);
      } else if (deleteAfter === '1h') {
        now.setHours(now.getHours() + 1);
      } else if (deleteAfter === '1d') {
        now.setDate(now.getDate() + 1);
      } else if (deleteAfter === '7d') {
        now.setDate(now.getDate() + 7);
      }
      expiresAt = now.toISOString();
    }

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

        if (!isLoggedIn && guestId) {
          db.incrementGuestUploadCount(guestId);
        }

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
          expiresAt,
          deleteAfter,
        });

        const siteUrlVal = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        return res.json({
          id: record.id,
          directUrl: `${siteUrlVal}/api/direct-image/${record.id}`,
          pageUrl: `/i/${record.id}`,
          width: record.width,
          height: record.height,
          bytes: record.bytes,
          filename: record.filename,
          isLocalFallback: true,
          expiresAt: record.expiresAt,
          deleteAfter: record.deleteAfter,
        });
      }
    } else {
      // Local Database Base64 Fallback
      const base64Data = req.file.buffer.toString('base64');
      const siteUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      imageUrl = `${siteUrl}/api/local-images/${fileId}`;

      if (!isLoggedIn && guestId) {
        db.incrementGuestUploadCount(guestId);
      }

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
        expiresAt,
        deleteAfter,
      });

      const siteUrlVal = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      return res.json({
        id: record.id,
        directUrl: `${siteUrlVal}/api/direct-image/${record.id}`,
        pageUrl: `/i/${record.id}`,
        width: record.width,
        height: record.height,
        bytes: record.bytes,
        filename: record.filename,
        isLocalFallback: true,
        expiresAt: record.expiresAt,
        deleteAfter: record.deleteAfter,
      });
    }

    if (!isLoggedIn && guestId) {
      db.incrementGuestUploadCount(guestId);
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
      expiresAt,
      deleteAfter,
    });

    const siteUrlVal = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.json({
      id: record.id,
      directUrl: `${siteUrlVal}/api/direct-image/${record.id}`,
      pageUrl: `/i/${record.id}`,
      width: record.width,
      height: record.height,
      bytes: record.bytes,
      filename: record.filename,
      expiresAt: record.expiresAt,
      deleteAfter: record.deleteAfter,
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

  // Check if image is expired on-the-fly
  const now = new Date().toISOString();
  if (image.expiresAt && image.expiresAt <= now) {
    db.deleteImage(image.id);
    return res.status(404).json({ error: 'Resim bulunamadı veya süresi doldu.' });
  }

  db.incrementImageViews(req.params.id);

  // Exclude localData from response
  const { localData, ...safeImage } = image;
  const siteUrlVal = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  safeImage.url = `${siteUrlVal}/api/direct-image/${image.id}`;
  res.json({
    ...safeImage,
    views: image.views + 1
  });
});

// Authenticated user's images
app.get('/api/images-mine', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Giriş yapılmadı' });
  const list = db.getImagesByUserId(req.user.id);
  const siteUrlVal = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  // Strip large localData fields and route image URLs through the secure proxy
  const safeList = list.map(({ localData, ...img }) => ({
    ...img,
    url: `${siteUrlVal}/api/direct-image/${img.id}`
  }));
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
    announcementTemplate: sysConfig.announcementTemplate,
    announcements: sysConfig.announcements || [],
    guestUploadLimit: sysConfig.guestUploadLimit !== undefined ? sysConfig.guestUploadLimit : 5,
    adEnabled: sysConfig.adEnabled,
    adImageUrl: sysConfig.adImageUrl,
    adTargetUrl: sysConfig.adTargetUrl,
    adTitle: sysConfig.adTitle,
    adDescription: sysConfig.adDescription,
    adButtonText: sysConfig.adButtonText,
    adDuration: sysConfig.adDuration
  });
});

// Guest Upload Stats Endpoint
app.get('/api/guest-stats', (req, res) => {
  const sysConfig = db.getSystemConfig();
  const allowedLimit = sysConfig.guestUploadLimit !== undefined ? sysConfig.guestUploadLimit : 5;
  let guestId = (req.headers['x-guest-uuid'] as string) || '';
  if (!guestId) {
    guestId = crypto.createHash('sha256').update(req.ip || 'unknown-ip').digest('hex');
  }
  const count = db.getGuestUploadCount(guestId);
  res.json({
    count,
    limit: allowedLimit,
    remaining: Math.max(0, allowedLimit - count)
  });
});

// System Config (Public GET)
app.get('/api/system-config', (req, res) => {
  res.json(db.getSystemConfig());
});

// Update System Config (Admin POST)
app.post('/api/system-config', requireAdmin, (req: AuthRequest, res) => {
  const { 
    maintenanceMode, 
    announcement, 
    announcementTemplate, 
    announcements, 
    guestUploadLimit,
    adEnabled,
    adImageUrl,
    adTargetUrl,
    adTitle,
    adDescription,
    adButtonText,
    adDuration
  } = req.body;
  
  const updated = db.updateSystemConfig({
    maintenanceMode: maintenanceMode === true,
    announcement: announcement === undefined ? null : announcement,
    announcementTemplate: announcementTemplate === undefined ? null : announcementTemplate,
    announcements: Array.isArray(announcements) ? announcements : [],
    guestUploadLimit: typeof guestUploadLimit === 'number' ? guestUploadLimit : 5,
    adEnabled: adEnabled === true,
    adImageUrl: typeof adImageUrl === 'string' ? adImageUrl : undefined,
    adTargetUrl: typeof adTargetUrl === 'string' ? adTargetUrl : undefined,
    adTitle: typeof adTitle === 'string' ? adTitle : undefined,
    adDescription: typeof adDescription === 'string' ? adDescription : undefined,
    adButtonText: typeof adButtonText === 'string' ? adButtonText : undefined,
    adDuration: typeof adDuration === 'number' ? adDuration : undefined
  });
  res.json(updated);
});

// Admin All Images list (Admin GET)
app.get('/api/admin/images', requireAdmin, (req: AuthRequest, res) => {
  const images = db.getImages();
  const siteUrlVal = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  // Strip large localData fields and route image URLs through the secure proxy
  const safeImages = images.map(({ localData, ...img }) => ({
    ...img,
    url: `${siteUrlVal}/api/direct-image/${img.id}`
  }));
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

// ================= ABUSE REPORTS (DMCA / VIOLATIONS) =================

// Public Submit Abuse Report
app.post('/api/reports', (req, res) => {
  const { imageId, imageUrl, reporterName, reporterEmail, reason, description } = req.body;
  if (!reporterName || !reporterEmail || !reason || !description) {
    return res.status(400).json({ error: 'Lütfen tüm alanları doldurun.' });
  }
  const report = db.addReport({
    imageId: imageId || null,
    imageUrl: imageUrl || null,
    reporterName,
    reporterEmail,
    reason,
    description
  });
  res.status(201).json({ success: true, report });
});

// Admin Get All Reports
app.get('/api/admin/reports', requireAdmin, (req: AuthRequest, res) => {
  res.json({ reports: db.getReports() });
});

// Admin Update Report Status
app.post('/api/admin/reports/:id/status', requireAdmin, (req: AuthRequest, res) => {
  const { status } = req.body;
  if (status !== 'pending' && status !== 'resolved') {
    return res.status(400).json({ error: 'Geçersiz durum.' });
  }
  const updated = db.updateReportStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Rapor bulunamadı.' });
  }
  res.json({ success: true, report: updated });
});

// Admin Delete Report
app.delete('/api/admin/reports/:id', requireAdmin, (req: AuthRequest, res) => {
  const deleted = db.deleteReport(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Rapor bulunamadı.' });
  }
  res.json({ success: true, message: 'Rapor silindi.' });
});

// ================= SUPPORT MESSAGES (CONTACT) =================

// Public Submit Support Message
app.post('/api/support-messages', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Lütfen tüm alanları doldurun.' });
  }
  const msg = db.addSupportMessage({
    name,
    email,
    subject,
    message
  });
  res.status(201).json({ success: true, message: msg });
});

// Admin Get All Support Messages
app.get('/api/admin/support-messages', requireAdmin, (req: AuthRequest, res) => {
  res.json({ messages: db.getSupportMessages() });
});

// Admin Update Support Message Status
app.post('/api/admin/support-messages/:id/status', requireAdmin, (req: AuthRequest, res) => {
  const { status } = req.body;
  if (status !== 'unread' && status !== 'read' && status !== 'resolved') {
    return res.status(400).json({ error: 'Geçersiz durum.' });
  }
  const updated = db.updateSupportMessageStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Mesaj bulunamadı.' });
  }
  res.json({ success: true, message: updated });
});

// Admin Delete Support Message
app.delete('/api/admin/support-messages/:id', requireAdmin, (req: AuthRequest, res) => {
  const deleted = db.deleteSupportMessage(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Mesaj bulunamadı.' });
  }
  res.json({ success: true, message: 'Mesaj silindi.' });
});

// Admin Reset All Guest Counters
app.post('/api/admin/reset-guest-uploads', requireAdmin, (req: AuthRequest, res) => {
  db.resetAllGuestUploads();
  res.json({ success: true, message: 'Tüm misafir yükleme limitleri sıfırlandı.' });
});

// ================= BACKGROUND CLEANUP OF EXPIRED IMAGES =================
function cleanupExpiredImages() {
  try {
    const now = new Date().toISOString();
    const images = db.getImages();
    const expired = images.filter(img => img.expiresAt && img.expiresAt <= now);
    if (expired.length > 0) {
      console.log(`[CLEANUP] Found ${expired.length} expired images.`);
      for (const img of expired) {
        if (isCloudinaryConfigured && img.publicId) {
          cloudinary.uploader.destroy(img.publicId).catch((err: any) => {
            console.error(`Failed to destroy expired Cloudinary asset for image ${img.id}:`, err);
          });
        }
        db.deleteImage(img.id);
        console.log(`[CLEANUP] Successfully deleted expired image: ${img.id}`);
      }
    }
  } catch (err) {
    console.error("[CLEANUP] Error during expired images cleanup:", err);
  }
}

// ================= VITE OR STATIC SERVING =================

async function start() {
  // Start periodic cleanup of self-destructing/temporary images (runs every 10 seconds)
  setInterval(cleanupExpiredImages, 10000);

  // Initialize and synchronize Firestore with the local database in the background (non-blocking)
  db.initFirestore().then(() => {
    console.log("Firestore database synchronization finished in background.");
  }).catch((dbErr) => {
    console.error("Failed to initialize database connection/sync in background:", dbErr);
  });

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
