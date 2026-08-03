import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

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

let firestore: any = null;
let isFirebaseInitialized = false;

async function initFirestoreConnection() {
  if (isFirebaseInitialized) return firestore;

  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let config: any = null;

  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.error("Error reading firebase-applet-config.json:", e);
    }
  }

  // Fallback to environment variables if config file doesn't exist
  const projectId = config?.projectId || process.env.FIREBASE_PROJECT_ID;
  const apiKey = config?.apiKey || process.env.FIREBASE_API_KEY;
  const authDomain = config?.authDomain || process.env.FIREBASE_AUTH_DOMAIN;
  const appId = config?.appId || process.env.FIREBASE_APP_ID;
  const databaseId = config?.firestoreDatabaseId || process.env.FIREBASE_DATABASE_ID || '(default)';

  if (!projectId) {
    console.log("Firebase project ID not found. Using local db.json database only.");
    return null;
  }

  try {
    let app;
    if (getApps().length === 0) {
      app = initializeApp({
        apiKey: apiKey || 'dummy-api-key',
        authDomain: authDomain || `${projectId}.firebaseapp.com`,
        projectId: projectId,
        appId: appId || 'dummy-app-id'
      });
    } else {
      app = getApps()[0];
    }

    if (app) {
      firestore = initializeFirestore(app, {}, databaseId);
      isFirebaseInitialized = true;
      console.log(`Firebase Client Firestore initialized. Project: ${projectId}, Database ID: ${databaseId}`);
      return firestore;
    }
    return null;
  } catch (error) {
    console.error("Failed to initialize Firebase Client SDK or Firestore:", error);
    return null;
  }
}

export const db = {
  async initFirestore() {
    const fsDb = await initFirestoreConnection();
    if (!fsDb) return;

    try {
      console.log("Synchronizing Firestore collections with local database state...");

      // 1. Sync Users
      const usersCol = collection(fsDb, 'users');
      const usersSnapshot = await getDocs(usersCol);
      const fsUsers: User[] = [];
      usersSnapshot.forEach((doc) => {
        fsUsers.push(doc.data() as User);
      });

      if (fsUsers.length > 0) {
        dbState.users = fsUsers;
        console.log(`Loaded ${fsUsers.length} users from Firestore.`);
      } else if (dbState.users.length > 0) {
        console.log(`Migrating ${dbState.users.length} local users to Firestore...`);
        for (const user of dbState.users) {
          await setDoc(doc(fsDb, 'users', user.id), user);
        }
      }

      // 2. Sync Images
      const imagesCol = collection(fsDb, 'images');
      const imagesSnapshot = await getDocs(imagesCol);
      const fsImages: ImageRecord[] = [];
      imagesSnapshot.forEach((doc) => {
        fsImages.push(doc.data() as ImageRecord);
      });

      if (fsImages.length > 0) {
        dbState.images = fsImages;
        console.log(`Loaded ${fsImages.length} images from Firestore.`);
      } else if (dbState.images.length > 0) {
        console.log(`Migrating ${dbState.images.length} local images to Firestore...`);
        for (const img of dbState.images) {
          await setDoc(doc(fsDb, 'images', img.id), img);
        }
      }

      // 3. Sync System Config
      const configDocRef = doc(fsDb, 'systemConfig', 'config');
      const configDoc = await getDoc(configDocRef);
      if (configDoc.exists()) {
        dbState.systemConfig = configDoc.data() as SystemConfig;
        console.log("Loaded system configuration from Firestore.");
      } else {
        await setDoc(configDocRef, dbState.systemConfig);
        console.log("Initialized system configuration in Firestore.");
      }

      saveDb();
      console.log("Firestore database synchronization completed successfully.");
    } catch (err) {
      console.error("Error during Firestore database sync:", err);
    }
  },

  getUsers(): User[] {
    return dbState.users;
  },

  getUserByEmail(email: string): User | undefined {
    const user = dbState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.email.toLowerCase() === 'iremsaltanat002001@gmail.com' && !user.isAdmin) {
      user.isAdmin = true;
      saveDb();
      if (isFirebaseInitialized && firestore) {
        updateDoc(doc(firestore, 'users', user.id), { isAdmin: true }).catch((err: any) => {
          console.error("Failed to update admin role in Firestore:", err);
        });
      }
    }
    return user;
  },

  getUserByUsername(username: string): User | undefined {
    return dbState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  getUserById(id: string): User | undefined {
    const user = dbState.users.find(u => u.id === id);
    if (user && user.email.toLowerCase() === 'iremsaltanat002001@gmail.com' && !user.isAdmin) {
      user.isAdmin = true;
      saveDb();
      if (isFirebaseInitialized && firestore) {
        updateDoc(doc(firestore, 'users', user.id), { isAdmin: true }).catch((err: any) => {
          console.error("Failed to update admin role in Firestore:", err);
        });
      }
    }
    return user;
  },

  addUser(user: Omit<User, 'id' | 'createdAt' | 'isAdmin'>): User {
    const isFirstUser = dbState.users.length === 0;
    const isOwner = user.email.toLowerCase() === 'iremsaltanat002001@gmail.com';
    const isNamedAdmin = user.username.toLowerCase().includes('admin') || user.email.toLowerCase().includes('admin');
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isAdmin: isFirstUser || isNamedAdmin || isOwner
    };
    dbState.users.push(newUser);
    saveDb();

    if (isFirebaseInitialized && firestore) {
      setDoc(doc(firestore, 'users', newUser.id), newUser).catch((err: any) => {
        console.error("Failed to save user to Firestore:", err);
      });
    }

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

    if (isFirebaseInitialized && firestore) {
      setDoc(doc(firestore, 'images', newImage.id), newImage).catch((err: any) => {
        console.error("Failed to save image to Firestore:", err);
      });
    }

    return newImage;
  },

  incrementImageViews(id: string) {
    const img = dbState.images.find(i => i.id === id);
    if (img) {
      img.views += 1;
      saveDb();

      if (isFirebaseInitialized && firestore) {
        setDoc(doc(firestore, 'images', id), img).catch((err: any) => {
          console.error("Failed to update image views in Firestore:", err);
        });
      }
    }
  },

  deleteImage(id: string): boolean {
    const index = dbState.images.findIndex(img => img.id === id);
    if (index !== -1) {
      dbState.images.splice(index, 1);
      saveDb();

      if (isFirebaseInitialized && firestore) {
        deleteDoc(doc(firestore, 'images', id)).catch((err: any) => {
          console.error("Failed to delete image from Firestore:", err);
        });
      }

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

    if (isFirebaseInitialized && firestore) {
      setDoc(doc(firestore, 'systemConfig', 'config'), dbState.systemConfig).catch((err: any) => {
        console.error("Failed to update system config in Firestore:", err);
      });
    }

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
