import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_FILE = path.join(process.cwd(), 'db.json');

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface ImageRecord {
  id: string;
  userId: string | null;
  url: string;
  publicId?: string; // for Cloudinary deletion
  filename: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  views: number;
  createdAt: string;
  isLocal?: boolean; // indicates if served locally
  localData?: string; // base64 representation if stored locally
}

export interface SystemConfig {
  maintenanceMode: boolean;
  announcement: string | null;
  announcementTemplate: string | null;
}

interface DatabaseSchema {
  users: User[];
  images: ImageRecord[];
  systemConfig: SystemConfig;
}

function initDb(): DatabaseSchema {
  const defaultSchema: DatabaseSchema = {
    users: [],
    images: [],
    systemConfig: {
      maintenanceMode: false,
      announcement: null,
      announcementTemplate: null
    }
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultSchema, null, 2));
    return defaultSchema;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    // Ensure systemConfig is initialized
    if (!parsed.systemConfig) {
      parsed.systemConfig = {
        maintenanceMode: false,
        announcement: null,
        announcementTemplate: null
      };
    }
    return parsed;
  } catch (error) {
    console.error("Error reading database file, recreating...", error);
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultSchema, null, 2));
    return defaultSchema;
  }
}

const dbState = initDb();

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2));
}

export const db = {
  getUsers(): User[] {
    return dbState.users;
  },

  getUserByEmail(email: string): User | undefined {
    return dbState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  getUserByUsername(username: string): User | undefined {
    return dbState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  getUserById(id: string): User | undefined {
    return dbState.users.find(u => u.id === id);
  },

  addUser(user: Omit<User, 'id' | 'createdAt' | 'isAdmin'>): User {
    const isFirstUser = dbState.users.length === 0;
    const isNamedAdmin = user.username.toLowerCase().includes('admin') || user.email.toLowerCase().includes('admin');
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isAdmin: isFirstUser || isNamedAdmin
    };
    dbState.users.push(newUser);
    saveDb();
    return newUser;
  },

  getImages(): ImageRecord[] {
    return dbState.images;
  },

  getImageById(id: string): ImageRecord | undefined {
    return dbState.images.find(img => img.id === id);
  },

  getImagesByUserId(userId: string): ImageRecord[] {
    return dbState.images.filter(img => img.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  addImage(image: Omit<ImageRecord, 'id' | 'views' | 'createdAt'> & { id?: string }): ImageRecord {
    const newImage: ImageRecord = {
      ...image,
      id: image.id || crypto.randomBytes(4).toString('hex'), // generates 8-char hex string
      views: 0,
      createdAt: new Date().toISOString()
    };
    dbState.images.push(newImage);
    saveDb();
    return newImage;
  },

  incrementImageViews(id: string) {
    const img = dbState.images.find(i => i.id === id);
    if (img) {
      img.views += 1;
      saveDb();
    }
  },

  deleteImage(id: string): boolean {
    const index = dbState.images.findIndex(img => img.id === id);
    if (index !== -1) {
      dbState.images.splice(index, 1);
      saveDb();
      return true;
    }
    return false;
  },

  getSystemConfig(): SystemConfig {
    if (!dbState.systemConfig) {
      dbState.systemConfig = {
        maintenanceMode: false,
        announcement: null,
        announcementTemplate: null
      };
    }
    return dbState.systemConfig;
  },

  updateSystemConfig(config: Partial<SystemConfig>): SystemConfig {
    if (!dbState.systemConfig) {
      dbState.systemConfig = {
        maintenanceMode: false,
        announcement: null,
        announcementTemplate: null
      };
    }
    dbState.systemConfig = {
      ...dbState.systemConfig,
      ...config
    };
    saveDb();
    return dbState.systemConfig;
  }
};

// Simple Password Utility
export const pwdUtil = {
  hash(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  },
  verify(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }
};
