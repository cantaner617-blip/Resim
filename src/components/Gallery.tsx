import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  Image, 
  Eye, 
  Trash2, 
  Calendar, 
  FileText, 
  Check, 
  Copy, 
  ExternalLink, 
  Loader2,
  User as UserIcon,
  Palette,
  CheckCircle2,
  Lock,
  Mail,
  ShieldAlert,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageRecord, User } from '../types';

interface GalleryProps {
  onSelectImage?: (id: string) => void;
  user?: User | null;
  themeShade?: 'midnight' | 'slate';
  onThemeShadeChange?: (shade: 'midnight' | 'slate') => void;
}

export default function Gallery({ onSelectImage, user, themeShade = 'midnight', onThemeShadeChange }: GalleryProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeTab = searchParams.get('tab') === 'profile' ? 'profile' : 'images';

  const handleSelect = (id: string) => {
    if (onSelectImage) {
      onSelectImage(id);
    } else {
      navigate(`/i/${id}`);
    }
  };

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/images-mine', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Görselleriniz yüklenirken hata oluştu.");
      }
      setImages(data.images || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Görseller alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Resim silinemedi.");
      }
      setImages(images.filter(img => img.id !== id));
      setDeletingId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopyLink = (e: any, id: string) => {
    e.stopPropagation();
    const pageUrl = `${window.location.origin}/i/${id}`;
    navigator.clipboard.writeText(pageUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-2 text-zinc-400" id="gallery-loader">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        <span className="text-sm font-medium">Resimleriniz yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="gallery-container">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">Hesap Paneli</h2>
          <p className="text-sm text-zinc-400">Görsellerinizi yönetin ve profil ayarlarınızı kişiselleştirin.</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-900 pb-px gap-6" id="gallery-tabs">
        <button
          onClick={() => setSearchParams({ tab: 'images' })}
          className={`pb-3.5 text-sm font-bold uppercase tracking-wider relative transition-colors duration-200 cursor-pointer ${
            activeTab === 'images' ? 'text-teal-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Görsellerim
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
              activeTab === 'images' ? 'bg-teal-500/10 text-teal-300' : 'bg-zinc-900 text-zinc-500'
            }`}>
              {images.length}
            </span>
          </span>
          {activeTab === 'images' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'profile' })}
          className={`pb-3.5 text-sm font-bold uppercase tracking-wider relative transition-colors duration-200 cursor-pointer ${
            activeTab === 'profile' ? 'text-teal-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Profil &amp; Ayarlar
          </span>
          {activeTab === 'profile' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-950 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'images' ? (
          <motion.div
            key="images-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-6"
          >
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-900 bg-zinc-950/20 p-12 text-center" id="gallery-empty-state">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-600 mb-4">
                  <Image className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Henüz görsel yüklemediniz</h3>
                <p className="text-sm text-zinc-400 mt-1 max-w-xs">
                  Profilinizde saklanacak ilk görselinizi yüklemek için yukarıdaki ana sayfaya gidin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="gallery-grid">
                {images.map((img) => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 hover:bg-zinc-950/60 transition-all duration-300 cursor-pointer"
                    onClick={() => handleSelect(img.id)}
                  >
                    {/* Image Thumbnail Preview container */}
                    <div className="relative aspect-[4/3] w-full bg-zinc-900/40 overflow-hidden flex items-center justify-center">
                      <img
                        src={img.url}
                        alt={img.filename}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      
                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                        <span className="text-xs text-zinc-300 font-mono tracking-tight">
                          {img.width}x{img.height} px
                        </span>
                        <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleCopyLink(e, img.id)}
                            className="rounded bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white p-1.5 transition-colors border border-zinc-800"
                            title="Link Kopyala"
                          >
                            {copiedId === img.id ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleSelect(img.id)}
                            className="rounded bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white p-1.5 transition-colors border border-zinc-800"
                            title="Sayfayı Görüntüle"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(img.id)}
                            className="rounded bg-red-950/90 hover:bg-red-900 text-red-400 hover:text-red-200 p-1.5 transition-colors border border-red-900/50"
                            title="Resmi Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Meta Content */}
                    <div className="p-3.5 flex flex-col justify-between flex-1 space-y-3">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-zinc-200 truncate" title={img.filename}>
                          {img.filename}
                        </h4>
                        <div className="flex items-center space-x-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {formatSize(img.bytes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {img.views} izlenme
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-900/60 pt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(img.createdAt)}
                        </span>
                        <span className="uppercase text-teal-500/80 font-mono font-semibold text-[10px] bg-teal-500/5 border border-teal-500/10 px-1.5 rounded">
                          {img.format}
                        </span>
                      </div>
                    </div>

                    {/* In-card deletion confirmation overlay */}
                    <AnimatePresence>
                      {deletingId === img.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-4 text-center z-10 space-y-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-red-400 font-bold text-sm">Görseli silmek istediğinize emin misiniz?</div>
                          <p className="text-xs text-zinc-400 max-w-[200px]">Bu işlem geri alınamaz ve dosya sunucudan silinir.</p>
                          <div className="flex items-center space-x-2 w-full max-w-[180px]">
                            <button
                              onClick={() => handleDelete(img.id)}
                              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-1.5 px-3 rounded text-xs transition-colors"
                            >
                              Evet, Sil
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 px-3 rounded text-xs transition-colors"
                            >
                              İptal
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Column: User Profile Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-32 w-32 bg-teal-500/5 rounded-full filter blur-xl pointer-events-none"></div>
                
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shadow-lg">
                    <UserIcon className="h-8 w-8 text-teal-400" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-white">{user?.username || "Kullanıcı"}</h3>
                    <p className="text-xs text-zinc-500">{user?.email || "e-posta belirtilmedi"}</p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border border-teal-500/20 bg-teal-500/5 text-teal-400">
                    {user?.isAdmin ? (
                      <>
                        <ShieldAlert className="h-3 w-3" />
                        Platform Yöneticisi
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Standart Üye
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-900/60 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-zinc-600" />
                      E-posta Adresi
                    </span>
                    <span className="text-zinc-300 font-semibold truncate max-w-[150px]" title={user?.email}>
                      {user?.email}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-zinc-600" />
                      Kayıt Tarihi
                    </span>
                    <span className="text-zinc-300 font-semibold">
                      {user?.createdAt ? formatDate(user.createdAt) : "Belirtilmedi"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-zinc-600" />
                      Hesap Durumu
                    </span>
                    <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Aktif
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right/Middle Column: Preferences & Settings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 shadow-xl space-y-6">
                
                {/* Heading */}
                <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-900/60">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/10">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Arayüz Kişiselleştirme</h3>
                    <p className="text-xs text-zinc-400">Karanlık temanın gözlerinize en uygun tonunu seçin.</p>
                  </div>
                </div>

                {/* Theme Shade Selection Options */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Karanlık Tema Tonu</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Midnight Option */}
                    <button
                      onClick={() => onThemeShadeChange && onThemeShadeChange('midnight')}
                      className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                        themeShade === 'midnight'
                          ? 'border-teal-500 bg-[#030712]/90 shadow-[0_0_20px_rgba(20,184,166,0.08)]'
                          : 'border-zinc-850 bg-zinc-950/20 hover:border-zinc-700 hover:bg-zinc-950/40'
                      }`}
                    >
                      {/* Interactive Visual Checkmark indicator */}
                      <div className="flex w-full justify-between items-center mb-4">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400 transition-colors">
                          Tema Tonu A
                        </span>
                        {themeShade === 'midnight' ? (
                          <div className="h-5 w-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-zinc-900 border border-zinc-800"></div>
                        )}
                      </div>

                      <div className="space-y-1 z-10">
                        <h4 className="font-extrabold text-white text-base">Midnight (Gece Yarısı)</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Sıcak lacivert ve derin kömür tonlarının harmanlandığı, gözü yormayan premium karanlık şema.
                        </p>
                      </div>

                      {/* Accent color pills representing the tone palette */}
                      <div className="flex gap-1.5 mt-5">
                        <span className="h-4 w-10 rounded bg-[#030712] border border-zinc-800"></span>
                        <span className="h-4 w-4 rounded bg-teal-500"></span>
                        <span className="h-4 w-4 rounded bg-zinc-800"></span>
                      </div>
                      
                      {/* Ambient background glow when selected */}
                      {themeShade === 'midnight' && (
                        <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-teal-500/5 rounded-full filter blur-xl pointer-events-none"></div>
                      )}
                    </button>

                    {/* Slate Option */}
                    <button
                      onClick={() => onThemeShadeChange && onThemeShadeChange('slate')}
                      className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                        themeShade === 'slate'
                          ? 'border-teal-500 bg-[#0f172a]/90 shadow-[0_0_20px_rgba(20,184,166,0.08)]'
                          : 'border-zinc-850 bg-zinc-950/20 hover:border-zinc-700 hover:bg-zinc-950/40'
                      }`}
                    >
                      {/* Interactive Visual Checkmark indicator */}
                      <div className="flex w-full justify-between items-center mb-4">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400 transition-colors">
                          Tema Tonu B
                        </span>
                        {themeShade === 'slate' ? (
                          <div className="h-5 w-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-zinc-900 border border-zinc-800"></div>
                        )}
                      </div>

                      <div className="space-y-1 z-10">
                        <h4 className="font-extrabold text-white text-base">Slate (Arduvaz)</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Soğuk çelik mavisi ve modern endüstriyel gri tonlardan oluşan, dinamik ve parlak bir karanlık şema.
                        </p>
                      </div>

                      {/* Accent color pills representing the tone palette */}
                      <div className="flex gap-1.5 mt-5">
                        <span className="h-4 w-10 rounded bg-[#0f172a] border border-slate-800"></span>
                        <span className="h-4 w-4 rounded bg-teal-500"></span>
                        <span className="h-4 w-4 rounded bg-slate-800"></span>
                      </div>

                      {/* Ambient background glow when selected */}
                      {themeShade === 'slate' && (
                        <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-teal-500/5 rounded-full filter blur-xl pointer-events-none"></div>
                      )}
                    </button>

                  </div>
                </div>

                {/* Friendly Info block */}
                <div className="rounded-xl bg-zinc-900/40 border border-zinc-850 p-4 flex gap-3 text-xs text-zinc-400">
                  <span className="text-base select-none">💡</span>
                  <p className="leading-relaxed">
                    Seçtiğiniz tema tonu tercihiniz tarayıcınızın yerel depolama (<strong className="text-zinc-300 font-semibold">localStorage</strong>) alanına kaydedilir. Böylece sonraki ziyaretlerinizde de tercihiniz korunur.
                  </p>
                </div>

              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
