import { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileImage, Copy, Check, Eye, Link as LinkIcon, Code, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, SystemStatus } from '../types';

interface UploaderProps {
  user: User | null;
  onUploadSuccess: (id: string) => void;
  systemStatus: SystemStatus | null;
}

interface UploadedResult {
  id: string;
  directUrl: string;
  pageUrl: string;
  filename: string;
  width: number;
  height: number;
  bytes: number;
}

export default function Uploader({ user, onUploadSuccess, systemStatus }: UploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadedResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [guestStats, setGuestStats] = useState<{ count: number; limit: number; remaining: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGuestStats = async () => {
    try {
      const headers: Record<string, string> = {};
      let guestUuid = localStorage.getItem('guest_uuid');
      if (guestUuid) {
        headers['X-Guest-UUID'] = guestUuid;
      }
      const response = await fetch('/api/guest-stats', { headers });
      if (response.ok) {
        const data = await response.json();
        setGuestStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch guest stats:", err);
    }
  };

  useEffect(() => {
    if (!user) {
      fetchGuestStats();
    } else {
      setGuestStats(null);
    }
  }, [user]);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (file: File) => {
    // Basic validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Yalnızca JPG, PNG, GIF, BMP ve WEBP formatlarındaki görseller yüklenebilir.");
      return;
    }

    // Guest remaining limit check
    if (!user && guestStats && guestStats.remaining <= 0) {
      setError(`Misafir yükleme limitine ulaştınız! Misafir olarak en fazla ${guestStats.limit} resim yükleyebilirsiniz. Hemen ücretsiz kayıt olarak sınırsız yüklemeye başlayın!`);
      return;
    }

    // Dynamic file size check: 20MB for guests, 100MB for logged in users
    const limitMb = user ? 100 : 20;
    const maxSize = limitMb * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Maksimum yükleme boyutu sınırını aştınız! ${user ? 'Üyeler' : 'Ziyaretçiler'} için limit ${limitMb} MB'dır. ${!user ? 'Hemen ücretsiz üye olarak bu limiti 100 MB yapabilirsiniz!' : ''}`);
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        let guestUuid = localStorage.getItem('guest_uuid');
        if (!guestUuid) {
          guestUuid = typeof crypto.randomUUID === 'function' 
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2) + Date.now().toString(36);
          localStorage.setItem('guest_uuid', guestUuid);
        }
        headers['X-Guest-UUID'] = guestUuid;
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Görsel yüklenirken sunucu tarafında bir hata oluştu.");
      }

      setResult(data);
      if (!user) {
        fetchGuestStats();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Yükleme sırasında teknik bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Pre-calculated share links
  const siteUrl = window.location.origin;
  const pageUrl = result ? `${siteUrl}/i/${result.id}` : '';
  const directUrl = result ? result.directUrl : '';
  
  const embedCodes = result ? {
    page: pageUrl,
    direct: directUrl,
    html: `<a href="${pageUrl}" target="_blank"><img src="${directUrl}" alt="${result.filename}" border="0" /></a>`,
    markdown: `![${result.filename}](${directUrl})`,
    bbcode: `[URL=${pageUrl}][IMG]${directUrl}[/IMG][/URL]`
  } : null;

  return (
    <div className="mx-auto max-w-4xl" id="uploader-container">
      {!result ? (
        <div className="space-y-6">
          {/* Main Upload Zone */}
          <div
            id="drag-drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 min-h-[340px] ${
              dragActive 
                ? 'border-teal-400 bg-teal-500/5 scale-[1.01]' 
                : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleChange}
              accept=".jpg,.jpeg,.png,.gif,.bmp,.webp"
              className="hidden"
              id="file-upload-input"
            />

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center space-y-4"
                  id="uploader-loading-state"
                >
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-zinc-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-teal-400 animate-spin"></div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-white">Görseliniz Yükleniyor</h3>
                    <p className="text-sm text-zinc-400">Bulut sunucularımıza aktarılıyor, lütfen bekleyin...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center space-y-4"
                  id="uploader-idle-state"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-teal-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-8 w-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      Resmini sürükle ve bırak veya <span className="text-teal-400 font-extrabold hover:underline">dosya seç</span>
                    </h3>
                    <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                      Maksimum {user ? '100' : '20'} MB boyutunda JPG, PNG, GIF, BMP veya WEBP dosyalarını yükleyebilirsiniz.
                    </p>
                  </div>

                  {!user ? (
                    <div className="rounded-full bg-zinc-900/80 px-4 py-1.5 text-xs text-zinc-400 border border-zinc-800/80">
                      💡 Giriş yapmadan yükleme limiti <strong>20 MB</strong>'dır. Üye olarak limitinizi <strong>100 MB</strong>'a çıkarabilirsiniz!
                    </div>
                  ) : (
                    <div className="rounded-full bg-teal-500/10 px-4 py-1.5 text-xs text-teal-400 border border-teal-500/25">
                      ✓ Giriş yaptınız. <strong>100 MB</strong>'lık yüksek üyelik limiti aktif!
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400"
              id="upload-error-alert"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Quick Notice */}
          {systemStatus?.localFallbackActive && (
            <div className="rounded-xl border border-amber-900/30 bg-amber-950/10 p-4 text-xs text-amber-300 flex items-start space-x-2.5">
              <span className="text-base">⚠️</span>
              <div>
                <strong className="font-semibold block mb-0.5">Yerel Depolama Modu Aktif</strong>
                Şu anda Cloudinary API anahtarları tanımlanmadığı için resimler yerel veritabanınızda geçici olarak saklanmaktadır. Kalıcı bulut depolama için lütfen Cloudinary bilgilerinizi secrets paneline ekleyin.
              </div>
            </div>
          )}

          {/* Guest Limit & Progress Bar Widget */}
          {!user && guestStats && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="rounded-2xl border border-zinc-900 bg-zinc-950/45 p-5 space-y-3.5 shadow-lg relative overflow-hidden"
              id="guest-progress-widget"
            >
              {/* Decorative soft backdrop glow */}
              <div className="absolute top-0 right-0 h-32 w-32 bg-teal-500/5 rounded-full filter blur-xl pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Misafir Yükleme Limiti
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Sisteme kayıt olmadan resim yüklüyorsunuz. Kalan yükleme hakkınız: <span className="text-teal-400 font-extrabold">{guestStats.remaining}</span> adet.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-white">
                    {guestStats.count} <span className="text-zinc-500">/ {guestStats.limit}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Yüklenen Resim</span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-900 border border-zinc-800/60 p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (guestStats.count / guestStats.limit) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    guestStats.remaining === 0 
                      ? 'bg-red-500' 
                      : guestStats.remaining <= 1 
                        ? 'bg-amber-500' 
                        : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                  }`}
                />
              </div>

              {/* Limit Status Alerts */}
              {guestStats.remaining === 0 ? (
                <div className="text-[11px] text-red-400 font-medium flex items-center gap-1.5 pt-0.5">
                  <span className="text-sm">⚠️</span>
                  <span>Misafir limitiniz doldu! Sınırsız yükleme hakkı ve yüksek boyut limiti için hemen ücretsiz üye olun.</span>
                </div>
              ) : guestStats.remaining <= 1 ? (
                <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1.5 pt-0.5 animate-pulse">
                  <span className="text-sm">⚡</span>
                  <span>Son 1 yükleme hakkınız kaldı! Ücretsiz üye olarak 100 MB limitiyle sınırsız yüklemeye geçin.</span>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500 flex items-center gap-1 pt-0.5">
                  <span>💡</span>
                  <span>Saniyeler içinde kayıt olarak 100 MB üye boyut limitinden faydalanabilirsiniz.</span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      ) : (
        /* Result Share Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 sm:p-8 space-y-6 shadow-xl"
          id="uploader-result-panel"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
            <div>
              <span className="inline-flex items-center rounded-md bg-teal-400/10 px-2.5 py-1 text-xs font-semibold text-teal-400 ring-1 ring-inset ring-teal-400/20 mb-2">
                ✓ Yükleme Başarılı
              </span>
              <h3 className="text-lg font-bold text-white truncate max-w-md">{result.filename}</h3>
              <p className="text-xs text-zinc-400">
                Boyut: {formatSize(result.bytes)} • Boyutlar: {result.width}x{result.height}px
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => onUploadSuccess(result.id)}
                className="flex items-center space-x-1.5 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-teal-400 transition-all duration-200"
                id="result-view-btn"
              >
                <Eye className="h-4 w-4" />
                <span>Resim Sayfasını Aç</span>
              </button>
              <button
                onClick={() => setResult(null)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-200"
                id="result-upload-more-btn"
              >
                Yeni Yükle
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Thumbnail Preview */}
            <div className="md:col-span-2 flex items-center justify-center bg-zinc-900/50 rounded-xl border border-zinc-900 p-4 min-h-[220px]">
              <img
                src={result.directUrl}
                alt={result.filename}
                referrerPolicy="no-referrer"
                className="max-h-56 max-w-full rounded-lg object-contain shadow-md"
              />
            </div>

            {/* Embed Codes inputs */}
            <div className="md:col-span-3 space-y-4">
              
              {/* Image Page link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                  <LinkIcon className="h-3.5 w-3.5 text-teal-400" />
                  Görsel İzleme Sayfası Linki
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={embedCodes?.page}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 pr-10 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCodes?.page || '', 'page')}
                    className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    {copiedField === 'page' ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Direct Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                  <FileImage className="h-3.5 w-3.5 text-teal-400" />
                  Doğrudan Resim Linki (Direct Link)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={embedCodes?.direct}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 pr-10 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCodes?.direct || '', 'direct')}
                    className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    {copiedField === 'direct' ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* HTML Embed Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                  <Code className="h-3.5 w-3.5 text-teal-400" />
                  HTML Embed Kodu
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={embedCodes?.html}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 pr-10 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCodes?.html || '', 'html')}
                    className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    {copiedField === 'html' ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* BBCode Embed Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                  BBCode Kodu (Forumlar İçin)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={embedCodes?.bbcode}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 pr-10 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCodes?.bbcode || '', 'bbcode')}
                    className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    {copiedField === 'bbcode' ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Markdown Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                  Markdown Embed Kodu
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={embedCodes?.markdown}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 pr-10 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCodes?.markdown || '', 'markdown')}
                    className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    {copiedField === 'markdown' ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      )}
    </div>
  );
}
