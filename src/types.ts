export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface ImageRecord {
  id: string;
  userId: string | null;
  url: string;
  filename: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  views: number;
  createdAt: string;
}

export interface Announcement {
  id: string;
  message: string;
  template: 'info' | 'warning' | 'success';
  createdAt: string;
}

export interface AbuseReport {
  id: string;
  imageId?: string | null;
  imageUrl?: string | null;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'resolved';
  createdAt: string;
}

export interface SystemStatus {
  isCloudinaryConfigured: boolean;
  localFallbackActive: boolean;
  maintenanceMode: boolean;
  announcement: string | null;
  announcementTemplate: string | null;
  announcements?: Announcement[];
  guestUploadLimit?: number;
}

export type ViewType = 'home' | 'my-images' | 'login' | 'register' | 'detail' | 'admin' | 'hakkimizda' | 'sartlar' | 'yardim';
