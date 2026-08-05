import { useState, useEffect } from 'react';
import { ChevronLeft, Eye, Calendar, FileText, ArrowDown, Copy, Check, Link as LinkIcon, Code, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageRecord } from '../types';

interface ImageDetailProps {
  id: string;
  onBack: () => void;
  user?: any;
  systemStatus?: any;
}

export default function ImageDetail({ id, onBack, user, systemStatus }: ImageDetailProps) {
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!image?.expiresAt) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(image.expiresAt!) - +new Date();
      if (difference <= 0) {
        setTimeLeft("Süresi Doldu (Siliniyor...)");
        return;
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (days > 0) parts.push(`${days}g`);
      if (hours > 0) parts.push(`${hours}s`);
      if (minutes > 0) parts.push(`${minutes}dk`);
      if (seconds > 0 || parts.length === 0) parts.push(`${seconds}sn`);

      setTimeLeft(parts.join(' '));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [image?.expiresAt]);

  useEffect(() => {
    const fetchImageDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/images/${id}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Görsel bilgileri sunucudan yüklenemedi.");
        }
        setImage(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Görsel ayrıntıları alınırken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchImageDetail();
  }, [id]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
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
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-2 text-zinc-400" id="detail-loader">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        <span className="text-sm">Görsel bilgileri yükleniyor...</span>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="mx-auto max-w-md text-center py-12 space-y-4" id="detail-error">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Resim Bulunamadı</h3>
        <p className="text-sm text-zinc-400">Aradığınız resim silinmiş veya erişim linki geçersiz olabilir.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Geri Dön</span>
        </button>
      </div>
    );
  }

  const siteUrl = window.location.origin;
  const pageUrl = `${siteUrl}/i/${image.id}`;
  const directUrl = image.url;

  const embedCodes = {
    page: pageUrl,
    direct: directUrl,
    html: `<a href="${pageUrl}" target="_blank"><img src="${directUrl}" alt="${image.filename}" border="0" /></a>`,
    markdown: `![${image.filename}](${directUrl})`,
    bbcode: `[URL=${pageUrl}][IMG]${directUrl}[/IMG][/URL]`
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6" id="detail-page-container">
      {/* Back Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all duration-200"
          id="detail-back-btn"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Geri Dön</span>
        </button>
        <a
          href={directUrl}
          download={image.filename}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-all duration-200"
          id="detail-download-btn"
        >
          <ArrowDown className="h-4 w-4" />
          <span>Orijinal Resmi İndir</span>
        </a>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Full Image Canvas viewer */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative flex items-center justify-center bg-zinc-950/40 rounded-2xl border border-zinc-900 p-4 sm:p-6 shadow-md overflow-hidden min-h-[350px]">
            <img
              src={directUrl}
              alt={image.filename}
              referrerPolicy="no-referrer"
              className="max-h-[500px] max-w-full rounded-lg object-contain shadow-lg"
            />
          </div>

          {/* Quick Specifications list */}
          <div className="grid grid-cols-3 gap-3 bg-zinc-950/20 border border-zinc-900/50 rounded-xl p-4 text-center">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Çözünürlük</span>
              <p className="text-sm font-bold text-zinc-200">{image.width} x {image.height} px</p>
            </div>
            <div className="space-y-1 border-x border-zinc-900">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Dosya Boyutu</span>
              <p className="text-sm font-bold text-zinc-200">{formatSize(image.bytes)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Format</span>
              <p className="text-sm font-bold text-teal-400 uppercase font-mono">{image.format}</p>
            </div>
          </div>
        </div>

        {/* Share codes and details panel */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Metadata details block */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4 shadow-sm">
            <h1 className="text-lg font-bold text-white leading-snug break-all line-clamp-2">{image.filename}</h1>
            
            {image.expiresAt && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 flex items-start gap-2.5 text-xs text-amber-400">
                <span className="text-base shrink-0">⏳</span>
                <div className="flex-1">
                  <strong className="font-bold block text-amber-300 mb-0.5">Süreli Görsel (Kendi Kendini Silen)</strong>
                  Görselin sunucularımızdan tamamen silinmesine kalan süre: <span className="font-mono font-bold text-white bg-zinc-900 px-1.5 py-0.5 rounded ml-1 border border-zinc-800">{timeLeft || 'hesaplanıyor...'}</span>
                </div>
              </div>
            )}
            
            <div className="border-t border-zinc-900 pt-4 space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
                Görsel İstatistikleri
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Views Stat Box */}
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-teal-500/20 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-10 h-10 bg-teal-500/5 rounded-full blur-md -mr-3 -mt-3 pointer-events-none group-hover:bg-teal-500/10 transition-all" />
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <Eye className="h-3.5 w-3.5 text-teal-400" />
                    Görüntülenme
                  </div>
                  <div className="mt-2">
                    <p className="text-lg font-black text-white tracking-tight">{image.views} kez</p>
                    <p className="text-[9px] text-zinc-500 font-medium">Toplam izlenme</p>
                  </div>
                </div>

                {/* Upload Date Stat Box */}
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-teal-500/20 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-10 h-10 bg-teal-500/5 rounded-full blur-md -mr-3 -mt-3 pointer-events-none group-hover:bg-teal-500/10 transition-all" />
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <Calendar className="h-3.5 w-3.5 text-teal-400" />
                    Yükleme Tarihi
                  </div>
                  <div className="mt-2 min-w-0">
                    <p className="text-xs font-extrabold text-white tracking-tight truncate animate-fade-in" title={formatDate(image.createdAt)}>
                      {formatDate(image.createdAt)}
                    </p>
                    <p className="text-[9px] text-zinc-500 font-medium">Sistem kayıt zamanı</p>
                  </div>
                </div>
              </div>

              {/* Storage details bar */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl px-3 py-2.5 flex items-center justify-between text-[10px] text-zinc-400 font-bold">
                <span className="flex items-center gap-1.5 text-zinc-500 uppercase tracking-wider">
                  <FileText className="h-3.5 w-3.5 text-teal-400" />
                  Altyapı Sınıfı
                </span>
                <span className="text-zinc-300 font-extrabold">
                  {image.url.includes('cloudinary') ? 'Bulut Depolama (Cloudinary)' : 'Yerel Sunucu Sürücüsü'}
                </span>
              </div>
            </div>
          </div>

          {/* Abuse Report Block */}
          <div className="rounded-2xl border border-red-950/30 bg-red-950/5 p-4 text-center space-y-2">
            <p className="text-xs text-zinc-400">Bu görselin telif hakkınızı veya topluluk kurallarını ihlal ettiğini mi düşünüyorsunuz?</p>
            <a
              href={`/ihbar?imageId=${image.id}&imageUrl=${encodeURIComponent(image.url)}`}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:underline"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Görseli İhbar Et / Kötüye Kullanım Bildir</span>
            </a>
          </div>

          {/* Elegant Sidebar Sponsor Ad Banner */}
          {systemStatus?.adEnabled && (!user || !user.isPremium) && (
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 overflow-hidden shadow-sm flex flex-col group transition-all hover:border-amber-500/20">
              <div className="relative aspect-[16/9] bg-zinc-950/60 overflow-hidden">
                {systemStatus.adImageUrl ? (
                  <img
                    src={systemStatus.adImageUrl}
                    alt="Sponsorlu"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 font-medium text-xs">Sponsorlu Görsel</div>
                )}
                <span className="absolute top-2.5 right-2.5 rounded bg-black/80 px-1.5 py-0.5 text-[8px] font-black text-white tracking-widest uppercase">
                  Sponsorlu
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-xs font-bold text-white line-clamp-1">
                  {systemStatus.adTitle || "Sponsorlu Reklam"}
                </h3>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed font-medium">
                  {systemStatus.adDescription || "Resim yükleme hizmetimizi ücretsiz sunabilmemiz için sponsorumuzu ziyaret edin."}
                </p>
                <a
                  href={systemStatus.adTargetUrl || "https://ai.studio/build"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 font-bold text-[11px] py-2 flex items-center justify-center gap-1.5 transition-all text-center"
                >
                  <span>{systemStatus.adButtonText || "Detayları Gör"}</span>
                </a>
              </div>
            </div>
          )}

          {/* Sharing URLs block */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-white tracking-tight">Paylaşım ve Embed Kodları</h2>
            
            <div className="space-y-4">
              {/* Image Page link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-teal-400" />
                  Görsel İzleme Sayfası Linki
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={embedCodes.page}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 pr-10 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCodes.page, 'page')}
                    className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    {copiedField === 'page' ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Direct Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-teal-400" />
                  Doğrudan Resim Linki (Direct Link)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={embedCodes.direct}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 pr-10 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCodes.direct, 'direct')}
                    className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    {copiedField === 'direct' ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* HTML Embed Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-teal-400" />
                  HTML Embed Kodu
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={embedCodes.html}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 pr-10 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCodes.html, 'html')}
                    className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    {copiedField === 'html' ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* BBCode Embed Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                  BBCode Kodu (Forumlar İçin)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={embedCodes.bbcode}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 pr-10 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCodes.bbcode, 'bbcode')}
                    className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    {copiedField === 'bbcode' ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Markdown Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                  Markdown Embed Kodu
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={embedCodes.markdown}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 pr-10 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCodes.markdown, 'markdown')}
                    className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    {copiedField === 'markdown' ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Elegant Inline Copy Sponsor Banner */}
              {systemStatus?.adEnabled && (!user || !user.isPremium) && (
                <div className="pt-4 border-t border-zinc-900 flex items-center justify-between gap-3 text-[10px] text-zinc-500 font-medium">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 px-1 py-0.5 rounded bg-amber-500/10 text-amber-500 font-extrabold tracking-wider uppercase text-[8px]">Sponsor</span>
                    <span className="truncate text-zinc-400">{systemStatus.adTitle || "Sponsorlu Reklam"}</span>
                  </div>
                  <a
                    href={systemStatus.adTargetUrl || "https://ai.studio/build"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-amber-500 hover:text-amber-400 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>{systemStatus.adButtonText || "Ziyaret Et"}</span>
                    <span>→</span>
                  </a>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
