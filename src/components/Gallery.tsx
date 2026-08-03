import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Image, Eye, Trash2, Calendar, FileText, Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageRecord } from '../types';

interface GalleryProps {
  onSelectImage?: (id: string) => void;
}

export default function Gallery({ onSelectImage }: GalleryProps) {
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    <div className="space-y-6" id="gallery-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Resimlerim</h2>
          <p className="text-sm text-zinc-400">Yüklediğiniz tüm resimlerin listesi ve yönetim paneli.</p>
        </div>
        <span className="rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
          Toplam: {images.length} Görsel
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-red-950 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

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
    </div>
  );
}
