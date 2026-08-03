import { useState, useEffect } from 'react';
import { ChevronLeft, Eye, Calendar, FileText, ArrowDown, Copy, Check, Link as LinkIcon, Code, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageRecord } from '../types';

interface ImageDetailProps {
  id: string;
  onBack: () => void;
}

export default function ImageDetail({ id, onBack }: ImageDetailProps) {
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
            
            <div className="space-y-2.5 border-t border-zinc-900 pt-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Calendar className="h-4 w-4 text-teal-400" />
                  Yükleme Tarihi
                </span>
                <span className="font-medium text-zinc-300">{formatDate(image.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Eye className="h-4 w-4 text-teal-400" />
                  Görüntülenme Sayısı
                </span>
                <span className="font-bold text-zinc-300">{image.views} kez izlendi</span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <FileText className="h-4 w-4 text-teal-400" />
                  Depolama Türü
                </span>
                <span className="font-medium text-zinc-300">
                  {image.url.includes('cloudinary') ? 'Cloudinary Cloud' : 'Yerel Veritabanı'}
                </span>
              </div>
            </div>
          </div>

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
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 pr-10 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCodes.markdown, 'markdown')}
                    className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  >
                    {copiedField === 'markdown' ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
