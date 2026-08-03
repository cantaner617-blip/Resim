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
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, ImageRecord, SystemStatus, Announcement } from '../types';

interface AdminPanelProps {
  user: User | null;
}

interface AdminImageRecord extends ImageRecord {
  userId: string | null;
  username?: string;
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const navigate = useNavigate();
  const [images, setImages] = useState<AdminImageRecord[]>([]);
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
          announcementTemplate: announcementsList.length > 0 ? announcementsList[0].template : null
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

  return (
    <div className="space-y-10" id="admin-panel">
      
      {/* Upper Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-teal-400" />
            Sistem Yönetim Paneli
          </h1>
          <p className="text-sm text-zinc-400">
            Duyuru sistemi, site bakım modu ayarları ve genel görsel yönetim paneli.
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
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Misafir Görseli</span>
            <span className="text-2xl font-black text-white block mt-1">{stats.guestImages}</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Üye Görseli</span>
            <span className="text-2xl font-black text-white block mt-1">{stats.memberImages}</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Control Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Controls Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main settings configuration */}
          <form onSubmit={handleSaveConfig} className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Settings className="h-5 w-5 text-teal-400" />
              Sistem ve Duyuru Ayarları
            </h2>

            {/* Maintenance Mode Option */}
            <div className="bg-zinc-950/50 rounded-xl border border-zinc-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-white block">Site Bakım Modu</span>
                  <span className="text-xs text-zinc-400 block">Aktif edildiğinde misafirler siteye erişemez, sadece yöneticiler işlem yapabilir.</span>
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

            {/* Announcement Editor */}
            <div className="space-y-6">
              <label className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                <Megaphone className="h-4 w-4 text-teal-400" />
                Duyuru Oluştur & Yayınla
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

        {/* Live Preview Column */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
              <span>👀 Duyuru Paneli Önizleme ({announcementsList.length})</span>
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
            <p><strong>Duyuru Sistemi:</strong> Şablonları kullanarak tek tuşla tüm kullanıcılara sitenin tepesinde görünecek renkli bir şerit uyarısı gönderebilirsiniz.</p>
            <p><strong>Bakım Modu:</strong> Bakım modunu etkinleştirdiğinizde, admin olmayan tüm kullanıcılar ve ziyaretçiler siteye girdiklerinde "Bakımdayız" arayüzünü görürler.</p>
          </div>
        </div>

      </div>

      {/* Database Image Gallery Management Panel */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Tüm Sistem Görselleri ({images.length})</h2>
          <p className="text-xs text-zinc-400">Sistemde yüklü olan tüm görselleri denetleyin, görüntülenmelerini inceleyin ve silin.</p>
        </div>

        {images.length === 0 ? (
          <div className="text-center p-12 rounded-xl bg-zinc-950/40 text-sm text-zinc-500 border border-zinc-900">
            Veritabanında hiç görsel kayıtlı değil.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-900">
                  <th className="p-4">Önizleme</th>
                  <th className="p-4">ID / Dosya Adı</th>
                  <th className="p-4">Yükleyen</th>
                  <th className="p-4">Boyut</th>
                  <th className="p-4">İzlenme</th>
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
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="p-4 font-mono max-w-[180px] truncate">
                        <span className="text-teal-400 block font-bold">{img.id}</span>
                        <span className="text-zinc-500 block text-[10px] truncate">{img.filename}</span>
                      </td>
                      <td className="p-4">
                        {img.userId ? (
                          <span className="inline-flex items-center rounded-full bg-teal-400/10 px-2 py-0.5 text-[10px] font-semibold text-teal-400 ring-1 ring-inset ring-teal-400/20">
                            Üye
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                            Misafir
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-300">
                        {fileSizeKb} KB
                      </td>
                      <td className="p-4 text-zinc-300 font-bold">
                        {img.views || 0}
                      </td>
                      <td className="p-4 text-zinc-500">
                        {new Date(img.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/i/${img.id}`)}
                          className="rounded border border-zinc-850 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 p-1.5 transition-colors"
                          title="Görüntüle"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="rounded border border-red-950 bg-red-950/10 hover:bg-red-950/30 text-red-400 p-1.5 transition-colors"
                          title="Sil"
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

    </div>
  );
}
