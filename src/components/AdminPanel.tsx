import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Megaphone, 
  ShieldAlert, 
  Trash2, 
  Eye, 
  Check, 
  Sparkles, 
  Users, 
  Image as ImageIcon, 
  Eye as EyeIcon, 
  AlertTriangle,
  RefreshCw,
  Clock,
  Plus,
  MessageSquare,
  Mail,
  User,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { User as UserType, ImageRecord, SystemStatus, Announcement, AbuseReport, SupportMessage } from '../types';

interface AdminPanelProps {
  user: UserType | null;
}

interface AdminImageRecord extends ImageRecord {
  userId: string | null;
  username?: string;
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'system' | 'images' | 'reports' | 'support'>('system');
  
  const [images, setImages] = useState<AdminImageRecord[]>([]);
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  
  const [stats, setStats] = useState({
    totalImages: 0,
    totalViews: 0,
    guestImages: 0,
    memberImages: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // System Config State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [guestLimit, setGuestLimit] = useState(5);
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [announcementTemplate, setAnnouncementTemplate] = useState<'info' | 'warning' | 'success'>('info');

  // Ready-Made Announcement Templates
  const readyTemplates = [
    {
      id: 'update',
      name: 'Sistem Güncellemesi 🚀',
      text: 'Sizlere daha iyi hizmet verebilmek için altyapımızı güncelledik! Artık yüklemeler %50 daha hızlı ve stabil çalışıyor. Keyifli paylaşımlar dileriz.',
      type: 'success' as const
    },
    {
      id: 'maintenance',
      name: 'Planlı Bakım Duyurusu 🛠️',
      text: 'Sistemlerimizde yapılacak planlı bakım çalışması nedeniyle bu gece 02:00 - 04:00 saatleri arasında yüklemelerde kısa süreli kesintiler yaşanabilir.',
      type: 'warning' as const
    },
    {
      id: 'welcome',
      name: 'ResimYükle\'ye Hoş Geldiniz! 🎉',
      text: 'Hızlı, reklamsız ve sınırsız görsel paylaşımının tadını çıkarın. Ücretsiz üye olarak yükleme limitinizi 100 MB\'a çıkarabileceğinizi unutmayın!',
      type: 'info' as const
    }
  ];

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    
    try {
      // 1. Fetch system status & config
      const statusRes = await fetch('/api/system-status');
      const statusData = await statusRes.json();
      if (statusRes.ok) {
        setMaintenanceMode(statusData.maintenanceMode || false);
        setAnnouncementsList(statusData.announcements || []);
        setGuestLimit(statusData.guestUploadLimit !== undefined ? statusData.guestUploadLimit : 5);
      }

      // 2. Fetch all images
      const imagesRes = await fetch('/api/admin/images', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const imagesData = await imagesRes.json();
      
      if (!imagesRes.ok) {
        throw new Error(imagesData.error || "Yönetici verileri alınamadı.");
      }

      const allImages: AdminImageRecord[] = imagesData.images || [];
      setImages(allImages);

      // 3. Compute Stats
      const totalViews = allImages.reduce((sum, img) => sum + (img.views || 0), 0);
      const guestImages = allImages.filter(img => !img.userId).length;
      const memberImages = allImages.filter(img => img.userId).length;

      setStats({
        totalImages: allImages.length,
        totalViews,
        guestImages,
        memberImages
      });

      // 4. Fetch Abuse Reports
      const reportsRes = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reportsRes.ok) {
        const rData = await reportsRes.json();
        setReports(rData.reports || []);
      }

      // 5. Fetch Support Messages
      const supportRes = await fetch('/api/admin/support-messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (supportRes.ok) {
        const sData = await supportRes.json();
        setSupportMessages(sData.supportMessages || []);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "İdari veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    fetchAdminData();
  }, [user]);

  // Handle Save Configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/system-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          maintenanceMode,
          announcements: announcementsList,
          announcement: announcementsList.length > 0 ? announcementsList[0].message : null,
          announcementTemplate: announcementsList.length > 0 ? announcementsList[0].template : null,
          guestUploadLimit: Number(guestLimit)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ayarlar kaydedilemedi.");
      }

      alert("Sistem ayarları başarıyla güncellendi!");
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Ayarlar güncellenirken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnnouncement = () => {
    if (!announcement.trim()) return;
    const newAnn: Announcement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      message: announcement.trim(),
      template: announcementTemplate,
      createdAt: new Date().toISOString()
    };
    setAnnouncementsList(prev => [newAnn, ...prev]);
    setAnnouncement('');
    setAnnouncementTemplate('info');
  };

  const handleRemoveAnnouncement = (id: string) => {
    setAnnouncementsList(prev => prev.filter(item => item.id !== id));
  };

  // Delete any image as Admin
  const handleDeleteImage = async (id: string) => {
    if (!window.confirm("Bu görseli sistemden kalıcı olarak silmek istediğinize emin misiniz?")) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/admin/images/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Resim silinemedi.");
      }

      // Success
      setImages(prev => prev.filter(img => img.id !== id));
      setStats(prev => ({
        ...prev,
        totalImages: prev.totalImages - 1
      }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Resolve Abuse Report
  const handleResolveReport = async (reportId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'resolved' })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Rapor güncellenemedi.');
      }
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Abuse Report
  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Bu bildirim kaydını listeden tamamen silmek istediğinize emin misiniz?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Rapor silinemedi.');
      }
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Resolve / Mark Support Message
  const handleMarkSupportMessage = async (msgId: string, status: 'read' | 'resolved') => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/support-messages/${msgId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Mesaj güncellenemedi.');
      }
      setSupportMessages(prev => prev.map(m => m.id === msgId ? { ...m, status } : m));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Support Message
  const handleDeleteSupportMessage = async (msgId: string) => {
    if (!window.confirm("Bu destek talebini silmek istediğinize emin misiniz?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/support-messages/${msgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Destek talebi silinemedi.');
      }
      setSupportMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Reset all guest upload limits
  const handleResetGuestUploads = async () => {
    if (!window.confirm("Tüm misafirlerin yükleme sayaçlarını sıfırlamak ve limitlerini tazelemek istediğinize emin misiniz?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/reset-guest-uploads', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Sayaçlar sıfırlanamadı.');
      }
      alert('Tüm misafir yükleme limitleri başarıyla sıfırlandı!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const applyTemplate = (text: string, type: 'info' | 'warning' | 'success') => {
    setAnnouncement(text);
    setAnnouncementTemplate(type);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center space-x-2 text-zinc-400">
        <RefreshCw className="h-6 w-6 animate-spin text-teal-400" />
        <span className="text-sm font-medium">Yönetim paneli yükleniyor...</span>
      </div>
    );
  }

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
  const unreadMessagesCount = supportMessages.filter(m => m.status === 'unread').length;

  return (
    <div className="space-y-8" id="admin-panel">
      
      {/* Upper Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-teal-400" />
            Sistem Yönetim Paneli
          </h1>
          <p className="text-sm text-zinc-400">
            Duyuru sistemi, misafir sınırları, ihbarlar (DMCA), destek talepleri ve görsel yönetimi.
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-3.5 py-2 text-sm font-semibold text-zinc-300 transition-all cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Verileri Yenile</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-950 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Admin Quick Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="admin-stats-grid">
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Toplam Görsel</span>
            <span className="text-2xl font-black text-white block mt-1">{stats.totalImages}</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
            <ImageIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Toplam Görüntülenme</span>
            <span className="text-2xl font-black text-white block mt-1">{stats.totalViews}</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <EyeIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Aktif İhbarlar (DMCA)</span>
            <span className="text-2xl font-black text-red-400 block mt-1">{pendingReportsCount}</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-950/30 text-red-400 border border-red-900/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Okunmamış Destek</span>
            <span className="text-2xl font-black text-blue-400 block mt-1">{unreadMessagesCount}</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-900 gap-1 overflow-x-auto pb-px" id="admin-tabs">
        <button
          onClick={() => setActiveTab('system')}
          className={`px-5 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'system' 
              ? 'border-teal-500 text-teal-400' 
              : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-800'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Sistem &amp; Misafir Ayarları</span>
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className={`px-5 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'images' 
              ? 'border-teal-500 text-teal-400' 
              : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-800'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Görsel Havuzu ({images.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-5 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'reports' 
              ? 'border-teal-500 text-teal-400' 
              : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-800'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>DMCA / İhbar Paneli ({pendingReportsCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-5 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'support' 
              ? 'border-teal-500 text-teal-400' 
              : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-800'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Destek Mesajları ({unreadMessagesCount})</span>
        </button>
      </div>

      {/* Render based on active tab */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-150" id="tab-system-content">
          <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleSaveConfig} className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Settings className="h-5 w-5 text-teal-400" />
                Duyurular &amp; Limit Ayarları
              </h2>

              {/* Maintenance Mode Option */}
              <div className="bg-zinc-950/50 rounded-xl border border-zinc-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-white block">Site Bakım Modu</span>
                    <span className="text-xs text-zinc-400 block">Aktif edildiğinde sadece yöneticiler işlem yapabilir, misafirlere uyarı gösterilir.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-zinc-950"></div>
                  </label>
                </div>

                {maintenanceMode && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Şu anda bakım modu seçili. Değişikliklerin kaydedilmesiyle birlikte site ziyaretçilere kapatılacaktır!</span>
                  </div>
                )}
              </div>

              {/* Guest Upload Limit Control */}
              <div className="bg-zinc-950/50 rounded-xl border border-zinc-900 p-4 space-y-4">
                <div className="space-y-1">
                  <span className="text-sm font-bold text-white block">Misafir Yükleme Limiti</span>
                  <span className="text-xs text-zinc-400 block">
                    Misafirlerin üye olmadan yapabileceği maksimum başarılı görsel yükleme sayısı. Üyeler limitsizdir!
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-1/3">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={guestLimit}
                      onChange={(e) => setGuestLimit(Number(e.target.value))}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleResetGuestUploads}
                    className="w-full sm:w-auto flex items-center justify-center space-x-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-white text-zinc-300 font-semibold text-xs px-4 py-3 transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Tüm Misafir Sayaçlarını Sıfırla / Yenile</span>
                  </button>
                </div>
              </div>

              {/* Announcement Editor */}
              <div className="space-y-6">
                <label className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                  <Megaphone className="h-4 w-4 text-teal-400" />
                  Duyuru Oluştur &amp; Yayınla
                </label>

                {/* Ready Made Templates list */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-zinc-500">Hazır Duyuru Şablonları:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {readyTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t.text, t.type)}
                        className="text-left rounded-lg border border-zinc-900 bg-zinc-950/60 p-2.5 hover:border-teal-500/40 hover:bg-zinc-900/50 transition-colors text-xs"
                      >
                        <strong className="text-zinc-300 font-bold block mb-1">{t.name}</strong>
                        <span className="text-zinc-500 line-clamp-2">{t.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 bg-zinc-950/45 rounded-xl border border-zinc-900 p-4">
                  <span className="text-xs font-bold text-zinc-300 block">Yeni Duyuru Ekle</span>
                  
                  <textarea
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    placeholder="Duyuru metnini buraya girin veya yukarıdaki taslaklardan birini seçin..."
                    rows={3}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/25 p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-zinc-500 block uppercase">Şablon Stili</span>
                      <div className="flex gap-2">
                        {[
                          { key: 'info', label: 'Bilgi (Mavi)', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                          { key: 'warning', label: 'Uyarı (Sarı)', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                          { key: 'success', label: 'Başarı (Yeşil)', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
                        ].map((style) => (
                          <button
                            key={style.key}
                            type="button"
                            onClick={() => setAnnouncementTemplate(style.key as any)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                              announcementTemplate === style.key 
                                ? `${style.bg} ring-1 ring-teal-500` 
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddAnnouncement}
                      disabled={!announcement.trim()}
                      className="w-full sm:w-auto flex items-center justify-center space-x-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs px-4 py-2 disabled:opacity-40 transition-all cursor-pointer self-end"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Duyuru Listesine Ekle</span>
                    </button>
                  </div>
                </div>

                {/* Active Announcements List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Aktif Duyurular Listesi ({announcementsList.length})</span>
                  </span>
                  
                  {announcementsList.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {announcementsList.map((item, index) => (
                        <div 
                          key={item.id} 
                          className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-xs relative overflow-hidden ${
                            item.template === 'success' 
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
                              : item.template === 'warning' 
                                ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' 
                                : 'bg-blue-500/5 border-blue-500/20 text-blue-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-extrabold uppercase tracking-widest text-[9px] px-1.5 py-0.5 rounded bg-zinc-900/80 text-zinc-300">
                                #{announcementsList.length - index} {item.template === 'success' ? 'Duyuru' : item.template === 'warning' ? 'Önemli' : 'Bilgi'}
                              </span>
                              <span className="text-[10px] text-zinc-500">{new Date(item.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="font-medium whitespace-pre-line leading-relaxed break-words">{item.message}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAnnouncement(item.id)}
                            className="text-zinc-500 hover:text-red-400 p-1 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                            title="Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-850 p-4 text-center text-xs text-zinc-500">
                      Şu anda listede yayınlanacak hiç duyuru bulunmuyor. Yeni bir tane ekleyip aşağıdaki butondan kaydedebilirsiniz.
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-teal-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent"></div>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Sistem Ayarlarını Kaydet ve Yayınla</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Guidelines Sidebar info */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                <span>👀 Duyuru Önizleme ({announcementsList.length})</span>
              </h2>

              {announcementsList.length > 0 ? (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {announcementsList.map((item) => (
                    <div 
                      key={item.id}
                      className={`rounded-xl border p-3.5 text-xs space-y-1.5 ${
                        item.template === 'success' 
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                          : item.template === 'warning'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[9px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
                        {item.template === 'success' ? 'Başarılı / Güncelleme' : item.template === 'warning' ? 'Önemli Uyarı' : 'Sistem Bilgilendirmesi'}
                      </div>
                      <p className="leading-relaxed whitespace-pre-line font-medium">{item.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-850 p-6 text-center text-xs text-zinc-600">
                  Şu anda aktif veya önizlenebilecek bir duyuru girilmedi.
                </div>
              )}
            </div>
            
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-3 text-xs text-zinc-400">
              <h3 className="font-bold text-white flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Yönetici Kılavuzu
              </h3>
              <p><strong>Misafir Limiti:</strong> Misafirlerin sadece 5 kere yükleme yapmasını zorunlu kılabilir ya da bu limiti buradan dilediğiniz gibi yükseltebilirsiniz.</p>
              <p><strong>Limit Sıfırlama:</strong> Sistemdeki tüm geçici misafir sayaçlarını tek bir tıkla sıfırlayarak onlara yeni yükleme hakları sunabilirsiniz.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'images' && (
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-6 animate-in fade-in duration-150" id="tab-images-content">
          <div>
            <h2 className="text-xl font-bold text-white">Sistem Görsel Havuzu ({images.length})</h2>
            <p className="text-xs text-zinc-400">Sunucu üzerinde yüklü olan tüm görselleri listeyebilir, orijinal hallerini inceleyebilir ve silebilirsiniz.</p>
          </div>

          {images.length === 0 ? (
            <div className="text-center p-12 rounded-xl bg-zinc-950/40 text-sm text-zinc-500 border border-zinc-900">
              Sistemde kayıtlı hiç görsel bulunamadı.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-900">
                    <th className="p-4">Görsel</th>
                    <th className="p-4">ID &amp; Dosya Adı</th>
                    <th className="p-4">Yükleyen Tipi</th>
                    <th className="p-4">Boyut &amp; Çözünürlük</th>
                    <th className="p-4">Görüntülenme</th>
                    <th className="p-4">Tarih</th>
                    <th className="p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {images.map((img) => {
                    const fileSizeKb = (img.bytes / 1024).toFixed(1);
                    return (
                      <tr key={img.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="p-4">
                          <div className="h-10 w-10 shrink-0 bg-zinc-900 rounded overflow-hidden flex items-center justify-center border border-zinc-800">
                            <img 
                              src={img.url} 
                              alt={img.filename} 
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover animate-fade-in"
                            />
                          </div>
                        </td>
                        <td className="p-4 font-mono max-w-[200px] truncate">
                          <span className="text-teal-400 block font-bold">{img.id}</span>
                          <span className="text-zinc-500 block text-[10px] truncate">{img.filename}</span>
                        </td>
                        <td className="p-4">
                          {img.userId ? (
                            <span className="inline-flex items-center rounded-full bg-teal-400/10 px-2 py-0.5 text-[10px] font-semibold text-teal-400 ring-1 ring-inset ring-teal-400/20">
                              Üye Görseli
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                              Misafir Görseli
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-zinc-300">
                          <span className="block">{fileSizeKb} KB</span>
                          <span className="block text-[10px] text-zinc-500">{img.width}x{img.height} px</span>
                        </td>
                        <td className="p-4 text-zinc-300 font-bold">
                          {img.views || 0} kez
                        </td>
                        <td className="p-4 text-zinc-500">
                          {new Date(img.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => navigate(`/i/${img.id}`)}
                            className="rounded border border-zinc-850 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 p-1.5 transition-colors cursor-pointer"
                            title="İncele &amp; Kodları Gör"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteImage(img.id)}
                            className="rounded border border-red-950 bg-red-950/10 hover:bg-red-950/30 text-red-400 p-1.5 transition-colors cursor-pointer"
                            title="Kalıcı Olarak Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-6 animate-in fade-in duration-150" id="tab-reports-content">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-400" />
              Telif Hakkı (DMCA) &amp; İhlal İhbarları ({reports.length})
            </h2>
            <p className="text-xs text-zinc-400">Ziyaretçiler tarafından iletilen telif hakkı bildirimlerini ve uygunsuz içerik şikayetlerini bu panelden denetleyin.</p>
          </div>

          {reports.length === 0 ? (
            <div className="text-center p-12 rounded-xl bg-zinc-950/40 text-sm text-zinc-500 border border-zinc-900">
              Harika! Şu anda incelenmeyi bekleyen hiçbir ihlal bildirimi bulunmuyor.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => (
                <div 
                  key={rep.id} 
                  className={`rounded-2xl border p-5 sm:p-6 space-y-4 transition-all ${
                    rep.status === 'pending'
                      ? 'bg-red-950/5 border-red-950/40 shadow-sm'
                      : 'bg-zinc-950/35 border-zinc-900/60 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900/40 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                          rep.reason.includes('Telif') 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/10'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                        }`}>
                          {rep.reason}
                        </span>
                        
                        {rep.status === 'pending' ? (
                          <span className="inline-flex items-center rounded-full bg-red-400/10 px-2.5 py-0.5 text-[10px] font-bold text-red-400 ring-1 ring-inset ring-red-400/20">
                            İnceleme Bekliyor
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-inset ring-emerald-400/20">
                            Çözüldü / İncelendi
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-bold">Rapor ID: <span className="font-mono text-zinc-400">{rep.id}</span> • {new Date(rep.createdAt).toLocaleString('tr-TR')}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {rep.status === 'pending' && (
                        <button
                          onClick={() => handleResolveReport(rep.id)}
                          className="flex items-center space-x-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Çözüldü İşaretle</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReport(rep.id)}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                        title="İhbarı Arşivden Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Reporter details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-900/60">
                    <div>
                      <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[9px] mb-0.5">Bildiren Kişi</span>
                      <p className="text-zinc-300 font-semibold">{rep.reporterName}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[9px] mb-0.5">E-Posta</span>
                      <a href={`mailto:${rep.reporterEmail}`} className="text-teal-400 hover:underline font-semibold block">{rep.reporterEmail}</a>
                    </div>
                  </div>

                  {/* Reported Image block */}
                  {(rep.imageId || rep.imageUrl) && (
                    <div className="flex items-start gap-4 p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-900/80 text-xs">
                      {rep.imageUrl && (
                        <div className="h-14 w-14 shrink-0 bg-zinc-900 rounded border border-zinc-800 overflow-hidden flex items-center justify-center">
                          <img 
                            src={rep.imageUrl} 
                            alt="Şikayet Edilen Görsel" 
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] block">İhbar Edilen Görsel</span>
                        {rep.imageId && <p className="text-zinc-300 font-mono text-[11px]">Görsel ID: <span className="text-teal-400 font-bold">{rep.imageId}</span></p>}
                        {rep.imageUrl && (
                          <div className="flex items-center gap-2">
                            <a 
                              href={rep.imageUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-teal-400 hover:underline font-medium truncate max-w-xs sm:max-w-md block flex items-center gap-1"
                            >
                              <span>Görsel Bağlantısını Aç</span>
                              <ExternalLink className="h-3 w-3 inline-block" />
                            </a>
                            {rep.imageId && (
                              <button
                                onClick={() => navigate(`/i/${rep.imageId}`)}
                                className="text-zinc-400 hover:text-white hover:underline text-[11px]"
                              >
                                Detay Sayfası
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {rep.imageId && (
                        <button
                          onClick={() => handleDeleteImage(rep.imageId!)}
                          className="flex items-center space-x-1 rounded-lg border border-red-950 bg-red-950/20 hover:bg-red-950/40 text-red-400 px-2.5 py-1.5 font-bold transition-all shrink-0 text-[11px] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Görseli Sunucudan Sil</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Description text */}
                  <div className="space-y-1.5">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] block">Bildirim Detayları &amp; Deliller</span>
                    <p className="text-sm text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed bg-zinc-900/10 border border-zinc-900/20 rounded-xl p-4 select-text">
                      {rep.description}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'support' && (
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-6 animate-in fade-in duration-150" id="tab-support-content">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-blue-400" />
              7/24 İletişim &amp; Destek Merkezi Talepleri ({supportMessages.length})
            </h2>
            <p className="text-xs text-zinc-400">Kullanıcılar tarafından form üzerinden gönderilen tüm yardım, destek ve kurumsal iletişim mesajları.</p>
          </div>

          {supportMessages.length === 0 ? (
            <div className="text-center p-12 rounded-xl bg-zinc-950/40 text-sm text-zinc-500 border border-zinc-900">
              Şu anda cevaplanmayı bekleyen hiçbir destek talebi bulunmuyor.
            </div>
          ) : (
            <div className="space-y-4">
              {supportMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`rounded-2xl border p-5 sm:p-6 space-y-4 transition-all ${
                    msg.status === 'unread'
                      ? 'bg-blue-950/5 border-blue-950/40 shadow-sm'
                      : 'bg-zinc-950/35 border-zinc-900/60 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900/40 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-base text-white font-extrabold">{msg.subject}</strong>
                        
                        {msg.status === 'unread' ? (
                          <span className="inline-flex items-center rounded-full bg-blue-400/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 ring-1 ring-inset ring-blue-400/20 animate-pulse">
                            Yeni Mesaj
                          </span>
                        ) : msg.status === 'read' ? (
                          <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold text-zinc-400">
                            Okundu
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-inset ring-emerald-400/20">
                            Cevaplandı / Çözüldü
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-bold">Mesaj ID: <span className="font-mono text-zinc-400">{msg.id}</span> • {new Date(msg.createdAt).toLocaleString('tr-TR')}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.status === 'unread' && (
                        <button
                          onClick={() => handleMarkSupportMessage(msg.id, 'read')}
                          className="flex items-center space-x-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border border-zinc-700/50"
                        >
                          <span>Okundu İşaretle</span>
                        </button>
                      )}
                      {msg.status !== 'resolved' && (
                        <button
                          onClick={() => handleMarkSupportMessage(msg.id, 'resolved')}
                          className="flex items-center space-x-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Çözüldü İşaretle</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSupportMessage(msg.id)}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                        title="Talebi Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sender details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-900/60">
                    <div>
                      <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[9px] mb-0.5">Gönderen Adı</span>
                      <p className="text-zinc-300 font-semibold flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-teal-400" />
                        {msg.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[9px] mb-0.5">E-Posta Adresi</span>
                      <a href={`mailto:${msg.email}`} className="text-teal-400 hover:underline font-semibold block flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-teal-400" />
                        {msg.email}
                      </a>
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="space-y-1.5">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] block">İletilen Mesaj</span>
                    <p className="text-sm text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed bg-zinc-900/10 border border-zinc-900/20 rounded-xl p-4 select-text">
                      {msg.message}
                    </p>
                  </div>

                  {/* Quick reply action */}
                  <div className="pt-2">
                    <a 
                      href={`mailto:${msg.email}?subject=Ynt: ${encodeURIComponent(msg.subject)}`}
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      <span>E-Posta ile Kullanıcıya Yanıt Gönder</span>
                    </a>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
