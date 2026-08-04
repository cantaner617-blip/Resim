import { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileImage, Copy, Check, Eye, Link as LinkIcon, Code, MessageSquare, AlertCircle, SlidersHorizontal, Zap, Signature, Clock, Sparkles, ExternalLink } from 'lucide-react';
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

const applyWatermark = (file: File, text: string): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Configure watermark style based on image size
        const size = Math.max(16, Math.floor(img.width * 0.035)); // Adaptive font size (3.5% of width)
        ctx.font = `bold ${size}px sans-serif`;
        
        // Measure text width to align bottom right with some padding
        const textMetrics = ctx.measureText(text);
        const paddingX = Math.max(16, img.width * 0.025);
        const paddingY = Math.max(16, img.height * 0.025);
        const x = img.width - textMetrics.width - paddingX;
        const y = img.height - paddingY;

        // Draw outline/shadow for high-contrast readability
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = Math.max(2, size * 0.15);
        ctx.strokeText(text, x, y);

        // Draw primary text with elegant high-contrast translucent white
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(text, x, y);

        // Export back to a File
        const format = file.type || 'image/png';
        canvas.toBlob((blob) => {
          if (blob) {
            const watermarkedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now()
            });
            resolve(watermarkedFile);
          } else {
            resolve(file);
          }
        }, format, 0.92);
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

const compressImage = (
  file: File,
  quality: number, // 0 to 100
  maxWidthOption: string // 'original' | '1280' | '1920' | '2560' | '3840'
): Promise<CompressionResult> => {
  return new Promise((resolve) => {
    // If it's a GIF or SVG, do not compress to avoid losing animations or vector quality
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
      resolve({ file, originalSize: file.size, compressedSize: file.size, ratio: 0 });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions if max width is defined and less than current width
        if (maxWidthOption !== 'original') {
          const maxDim = parseInt(maxWidthOption, 10);
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ file, originalSize: file.size, compressedSize: file.size, ratio: 0 });
          return;
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw and scale image
        ctx.drawImage(img, 0, 0, width, height);

        let format = file.type;
        // If it's BMP, convert to JPEG to compress, otherwise keep format
        if (format === 'image/bmp') {
          format = 'image/jpeg';
        }

        // Quality parameter is between 0 and 1
        const qFactor = quality / 100;

        canvas.toBlob((blob) => {
          if (blob) {
            const ext = format === 'image/jpeg' ? '.jpg' : format === 'image/png' ? '.png' : format === 'image/webp' ? '.webp' : '';
            let newName = file.name;
            if (ext) {
              newName = file.name.replace(/\.[^/.]+$/, "") + ext;
            }
            
            const compressedFile = new File([blob], newName, {
              type: format,
              lastModified: Date.now()
            });

            // If compressed file is indeed smaller, return it
            if (compressedFile.size < file.size) {
              const ratio = (file.size - compressedFile.size) / file.size;
              resolve({
                file: compressedFile,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                ratio
              });
            } else {
              resolve({ file, originalSize: file.size, compressedSize: file.size, ratio: 0 });
            }
          } else {
            resolve({ file, originalSize: file.size, compressedSize: file.size, ratio: 0 });
          }
        }, format, qFactor);
      };
      img.onerror = () => resolve({ file, originalSize: file.size, compressedSize: file.size, ratio: 0 });
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve({ file, originalSize: file.size, compressedSize: file.size, ratio: 0 });
    reader.readAsDataURL(file);
  });
};

export default function Uploader({ user, onUploadSuccess, systemStatus }: UploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<UploadedResult[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(0);
  const [showBulkCodes, setShowBulkCodes] = useState<boolean>(false);

  interface UploadProgressItem {
    id: string;
    filename: string;
    size: number;
    status: 'pending' | 'watermarking' | 'compressing' | 'uploading' | 'completed' | 'failed';
    error?: string;
    compressionRatio?: number;
    originalSize?: number;
    compressedSize?: number;
  }
  const [uploadQueue, setUploadQueue] = useState<UploadProgressItem[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [guestStats, setGuestStats] = useState<{ count: number; limit: number; remaining: number } | null>(null);

  const result = results.length > 0 ? results[activeResultIndex] : null;

  // Advanced configurations
  const [isWatermarkEnabled, setIsWatermarkEnabled] = useState<boolean>(() => {
    return localStorage.getItem('is_watermark_enabled') === 'true';
  });
  const [watermarkText, setWatermarkText] = useState<string>(() => {
    return localStorage.getItem('watermark_text') || 'AnındaResim';
  });
  const [deleteAfter, setDeleteAfter] = useState<string>('never');

  // Client-Side Image Compression configuration
  const [isCompressionEnabled, setIsCompressionEnabled] = useState<boolean>(() => {
    return localStorage.getItem('is_compression_enabled') !== 'false'; // default to true
  });
  const [compressionQuality, setCompressionQuality] = useState<number>(() => {
    return Number(localStorage.getItem('compression_quality')) || 80;
  });
  const [compressionMaxWidth, setCompressionMaxWidth] = useState<string>(() => {
    return localStorage.getItem('compression_max_width') || 'original';
  });

  // Advertisement states
  const [showAdModal, setShowAdModal] = useState<boolean>(false);
  const [adCountdown, setAdCountdown] = useState<number>(5);

  useEffect(() => {
    if (!showAdModal || adCountdown <= 0) return;
    const interval = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showAdModal, adCountdown]);

  useEffect(() => {
    localStorage.setItem('is_watermark_enabled', String(isWatermarkEnabled));
  }, [isWatermarkEnabled]);

  useEffect(() => {
    localStorage.setItem('watermark_text', watermarkText);
  }, [watermarkText]);

  useEffect(() => {
    localStorage.setItem('is_compression_enabled', String(isCompressionEnabled));
  }, [isCompressionEnabled]);

  useEffect(() => {
    localStorage.setItem('compression_quality', String(compressionQuality));
  }, [compressionQuality]);

  useEffect(() => {
    localStorage.setItem('compression_max_width', compressionMaxWidth);
  }, [compressionMaxWidth]);

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFilesUpload(Array.from(e.target.files));
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

  const handleFilesUpload = async (files: File[]) => {
    if (files.length === 0) return;

    // Check maximum simultaneous files limit
    const maxSimultaneous = user ? (user.isPremium ? 25 : 10) : (systemStatus?.guestUploadLimit ?? 5);
    if (files.length > maxSimultaneous) {
      setError(`Aynı anda en fazla ${maxSimultaneous} adet görsel yükleyebilirsiniz. Seçtiğiniz dosya sayısı: ${files.length}. Lütfen dosya sayısını azaltıp tekrar deneyin.`);
      return;
    }

    // Guest remaining limit check
    if (!user && guestStats) {
      if (guestStats.remaining <= 0) {
        setError(`Misafir yükleme limitine ulaştınız! Misafir olarak en fazla ${guestStats.limit} resim yükleyebilirsiniz. Hemen ücretsiz kayıt olarak sınırsız yüklemeye başlayın!`);
        return;
      }
      if (guestStats.remaining < files.length) {
        setError(`Seçtiğiniz görsel sayısı (${files.length}), kalan misafir yükleme limitinizi (${guestStats.remaining}) aşıyor! Lütfen daha az görsel seçin veya hemen ücretsiz kayıt olun.`);
        return;
      }
    }

    setError(null);
    setLoading(true);
    setResults([]);
    setActiveResultIndex(0);
    setShowBulkCodes(false);

    // Initialize queue state
    const initialQueue: UploadProgressItem[] = files.map((file, idx) => ({
      id: `${file.name}-${idx}-${Date.now()}`,
      filename: file.name,
      size: file.size,
      status: 'pending'
    }));
    setUploadQueue(initialQueue);

    const uploadedResults: UploadedResult[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    const limitMb = user ? 100 : 20;
    const maxSize = limitMb * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const queueId = initialQueue[i].id;

      // Validate format
      if (!allowedTypes.includes(file.type)) {
        setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'failed', error: "Geçersiz format. Yalnızca JPG, PNG, GIF, BMP, WEBP yüklenebilir." } : item));
        continue;
      }

      // Validate size
      if (file.size > maxSize) {
        setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'failed', error: `Maksimum limit ${limitMb} MB'dır.` } : item));
        continue;
      }

      // Process client-side compression if active
      let fileToUpload = file;
      let ratio = 0;
      let originalSize = file.size;
      let compressedSize = file.size;

      if (isCompressionEnabled) {
        try {
          setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'compressing' } : item));
          const compResult = await compressImage(file, compressionQuality, compressionMaxWidth);
          fileToUpload = compResult.file;
          originalSize = compResult.originalSize;
          compressedSize = compResult.compressedSize;
          ratio = compResult.ratio;

          // Update item in queue with compression info
          setUploadQueue(prev => prev.map(item => 
            item.id === queueId 
              ? { 
                  ...item, 
                  size: compressedSize, 
                  compressionRatio: ratio,
                  originalSize,
                  compressedSize
                } 
              : item
          ));
        } catch (compressErr) {
          console.error("Görsel sıkıştırma başarısız:", compressErr);
        }
      }

      // Process watermark if active
      if (isWatermarkEnabled && watermarkText.trim() !== '') {
        try {
          setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'watermarking' } : item));
          fileToUpload = await applyWatermark(fileToUpload, watermarkText.trim());
          
          // Re-update size if watermark changed it slightly
          setUploadQueue(prev => prev.map(item => 
            item.id === queueId 
              ? { ...item, size: fileToUpload.size } 
              : item
          ));
        } catch (watermarkErr) {
          console.error("Filigran ekleme başarısız:", watermarkErr);
        }
      }

      // Upload file
      try {
        setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'uploading' } : item));

        const formData = new FormData();
        formData.append('image', fileToUpload);
        formData.append('deleteAfter', deleteAfter);

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
          throw new Error(data.error || "Görsel yüklenirken bir hata oluştu.");
        }

        uploadedResults.push(data);
        setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'completed' } : item));
      } catch (err: any) {
        console.error(err);
        setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'failed', error: err.message || "Yükleme hatası." } : item));
      }
    }

    setLoading(false);

    if (uploadedResults.length > 0) {
      setResults(uploadedResults);
      setActiveResultIndex(0);
      if (!user) {
        fetchGuestStats();
      }
      let shouldShowAd = false;
      if (systemStatus?.adEnabled) {
        if (!user) {
          shouldShowAd = true;
        } else if (!user.isPremium) {
          shouldShowAd = systemStatus.adShowToRegistered !== false;
        }
      }

      if (shouldShowAd) {
        setAdCountdown(systemStatus.adDuration !== undefined ? systemStatus.adDuration : 5);
        setShowAdModal(true);
      }
    } else {
      setError("Seçilen görsellerin hiçbiri yüklenemedi. Lütfen formatları ve boyutları kontrol edin.");
    }
  };

  const handleCopy = (text: string, fieldName: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedField(fieldName);
    setShowToast(label);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
    setTimeout(() => {
      setShowToast(prev => prev === label ? null : prev);
    }, 2500);
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

  // Pre-calculated bulk embed codes
  const bulkEmbedCodes = results.length > 0 ? {
    page: results.map(res => `${siteUrl}/i/${res.id}`).join('\n'),
    direct: results.map(res => res.directUrl).join('\n'),
    html: results.map(res => `<a href="${siteUrl}/i/${res.id}" target="_blank"><img src="${res.directUrl}" alt="${res.filename}" border="0" /></a>`).join('\n'),
    markdown: results.map(res => `![${res.filename}](${res.directUrl})`).join('\n'),
    bbcode: results.map(res => `[URL=${siteUrl}/i/${res.id}][IMG]${res.directUrl}[/IMG][/URL]`).join('\n')
  } : null;

  const resetUploads = () => {
    setResults([]);
    setActiveResultIndex(0);
    setUploadQueue([]);
  };

  return (
    <div className="mx-auto max-w-4xl" id="uploader-container">
      {results.length === 0 ? (
        <div className="space-y-6">
          {/* Main Upload Zone */}
          <div
            id="drag-drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 min-h-[340px] group ${
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
              multiple
            />

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full max-w-xl space-y-5 text-left p-2 sm:p-4 cursor-default"
                  id="uploader-loading-state"
                  onClick={(e) => e.stopPropagation()} // Prevent triggering input click on queue item click
                >
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
                        Toplu Yükleme İşlemi ({uploadQueue.filter(x => x.status === 'completed').length} / {uploadQueue.length})
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 font-medium">Seçilen görseller sırayla sunucuya aktarılıyor...</p>
                    </div>
                    <div className="text-xs font-bold text-teal-400 font-mono">
                      {Math.round((uploadQueue.filter(x => x.status === 'completed' || x.status === 'failed').length / uploadQueue.length) * 100)}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/50">
                    <motion.div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(uploadQueue.filter(x => x.status === 'completed' || x.status === 'failed').length / uploadQueue.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Queue List */}
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
                    {uploadQueue.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-zinc-900/80 bg-zinc-950/40 p-3 text-xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                            item.status === 'completed'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : item.status === 'failed'
                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                : item.status === 'uploading'
                                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-400 animate-pulse'
                                  : item.status === 'compressing'
                                    ? 'bg-violet-500/10 border-violet-500/20 text-violet-400 animate-pulse'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}>
                            <FileImage className="h-4 w-4" />
                          </div>
                          <div className="truncate flex-1">
                            <p className="font-semibold text-zinc-200 truncate">{item.filename}</p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span>{formatSize(item.size)}</span>
                              {item.compressionRatio !== undefined && item.compressionRatio > 0 && (
                                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded text-[9px]">
                                  (-{(item.compressionRatio * 100).toFixed(0)}% Sıkıştırıldı)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 pl-3">
                          {item.status === 'completed' && (
                            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-450 ring-1 ring-inset ring-emerald-500/20">
                              ✓ Yüklendi
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-450 ring-1 ring-inset ring-red-500/20" title={item.error}>
                              Hata
                            </span>
                          )}
                          {item.status === 'uploading' && (
                            <span className="inline-flex items-center rounded-md bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-400 ring-1 ring-inset ring-teal-500/20 animate-pulse">
                              Yükleniyor
                            </span>
                          )}
                          {item.status === 'compressing' && (
                            <span className="inline-flex items-center rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-400 ring-1 ring-inset ring-violet-500/20 animate-pulse">
                              Sıkıştırılıyor...
                            </span>
                          )}
                          {item.status === 'watermarking' && (
                            <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-inset ring-amber-500/20 animate-pulse">
                              Filigran...
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <span className="inline-flex items-center rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-500 border border-zinc-800">
                              Bekliyor
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center space-y-6"
                  id="uploader-idle-state"
                >
                  {/* Central Animated Upload Icon Container */}
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing ring behind */}
                    <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-teal-500/10 to-emerald-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Animated Ripple Circles */}
                    <div className="absolute h-24 w-24 rounded-full border border-teal-500/5 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 ease-out" />
                    <div className="absolute h-20 w-20 rounded-full border border-teal-500/10 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 ease-out" />

                    {/* Main Icon Container */}
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-teal-400 shadow-inner group-hover:border-teal-500 group-hover:text-teal-300 group-hover:shadow-teal-950/20 group-hover:scale-105 transition-all duration-300">
                      <Upload className="h-7 w-7 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                      Resmini sürükle ve bırak veya <span className="text-teal-400 font-extrabold group-hover:text-teal-300 transition-colors">dosya seç</span>
                    </h3>
                    <p className="text-sm text-zinc-400 max-w-sm mx-auto font-medium">
                      Maksimum {user ? '100' : '20'} MB boyutunda JPG, PNG, GIF, BMP veya WEBP dosyalarını yükleyebilirsiniz.
                    </p>
                  </div>

                  {/* Format Badges Row */}
                  <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                    {['JPG', 'PNG', 'WEBP', 'GIF', 'BMP'].map((fmt) => (
                      <span 
                        key={fmt}
                        className="inline-flex items-center rounded-lg bg-zinc-900/80 px-2.5 py-1 text-[10px] font-black tracking-wider text-zinc-500 border border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-400 transition-colors duration-150"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>

                  {!user ? (
                    <div className="rounded-full bg-zinc-900/80 px-4 py-1.5 text-xs text-zinc-400 border border-zinc-800/80 shadow-sm flex items-center gap-2">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>
                        Giriş yapmadan yükleme limiti <strong>20 MB</strong>'dır. Üye olarak limitinizi <strong>100 MB</strong>'a çıkarabilirsiniz!
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-full bg-teal-500/10 px-4 py-1.5 text-xs text-teal-400 border border-teal-500/25 shadow-sm flex items-center gap-2">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-teal-400" />
                      <span>
                        ✓ Giriş yaptınız. <strong>100 MB</strong>'lık yüksek üyelik limiti aktif!
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Gelişmiş Seçenekler Paneli */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
            {/* Ambient accent top highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/20 to-transparent"></div>
            
            {/* Süreli Resim Seçeneği */}
            <div className="space-y-3.5 md:border-r md:border-zinc-900/60 md:pr-6 md:mr-1">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-400" /> Depolama Süresi
              </label>
              <div className="relative">
                <select
                  value={deleteAfter}
                  onChange={(e) => setDeleteAfter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-xs text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900/60 focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 focus:outline-none pr-10 cursor-pointer transition-all duration-200"
                  id="delete-after-select"
                >
                  <option value="never">Kalıcı (Silinmez)</option>
                  <option value="5m">Yüklemeden 5 Dakika Sonra Sil</option>
                  <option value="1h">Yüklemeden 1 Saat Sonra Sil</option>
                  <option value="1d">Yüklemeden 1 Gün Sonra Sil</option>
                  <option value="7d">Yüklemeden 7 Gün Sonra Sil</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[9px]">
                  ▼
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Resminizin belirtilen süre sonunda sunucularımızdan kalıcı olarak ve güvenle silinmesini sağlar.
              </p>
            </div>

            {/* Sıkıştırma ve Optimizasyon Seçeneği */}
            <div className="space-y-3.5 md:border-r md:border-zinc-900/60 md:pr-6 md:mr-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-teal-400" /> Sıkıştır &amp; Optimize Et
                </label>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCompressionEnabled}
                    onChange={(e) => setIsCompressionEnabled(e.target.checked)}
                    className="sr-only peer"
                    id="compression-toggle-checkbox"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-zinc-950 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"></div>
                </label>
              </div>

              <div className={`space-y-3.5 transition-all duration-300 ${isCompressionEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                {/* Genişlik/Çözünürlük Sınırı */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Çözünürlük Sınırı</span>
                  <div className="relative">
                    <select
                      value={compressionMaxWidth}
                      disabled={!isCompressionEnabled}
                      onChange={(e) => setCompressionMaxWidth(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900/60 focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 focus:outline-none pr-8 cursor-pointer transition-all duration-200"
                      id="compression-width-select"
                    >
                      <option value="original">Orijinal (Sınırsız)</option>
                      <option value="3840">4K Ultra HD (3840px)</option>
                      <option value="2560">2K Quad HD (2560px)</option>
                      <option value="1920">Full HD (1920px)</option>
                      <option value="1280">HD Ready (1280px)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[8px]">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Sıkıştırma Kalitesi Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Kalite Oranı</span>
                    <span className="text-[10px] font-bold text-teal-400 font-mono">
                      %{compressionQuality} {compressionQuality >= 90 ? '(Mükemmel)' : compressionQuality >= 75 ? '(Dengeli)' : '(Yüksek Sıkıştırma)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={compressionQuality}
                    disabled={!isCompressionEnabled}
                    onChange={(e) => setCompressionQuality(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none bg-gradient-to-r from-teal-500/20 to-teal-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Görselleri tarayıcıda akıllıca küçülterek veri tasarrufu sağlar ve anında yüklenmesini kolaylaştırır.
              </p>
            </div>

            {/* Filigran Ekleme Seçeneği */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Signature className="h-4 w-4 text-teal-400" /> Görsele Filigran Ekle
                </label>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isWatermarkEnabled}
                    onChange={(e) => setIsWatermarkEnabled(e.target.checked)}
                    className="sr-only peer"
                    id="watermark-toggle-checkbox"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-zinc-950 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"></div>
                </label>
              </div>

              <div className="transition-all duration-300 relative">
                <input
                  type="text"
                  disabled={!isWatermarkEnabled}
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Örn: AnındaResim"
                  maxLength={40}
                  className={`w-full rounded-xl border pl-8 pr-3.5 py-2 text-xs transition-all focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 ${
                    isWatermarkEnabled
                      ? 'border-zinc-800 bg-zinc-900/40 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900/60'
                      : 'border-zinc-900/40 bg-zinc-950/20 text-zinc-600 cursor-not-allowed'
                  }`}
                  id="watermark-text-input"
                />
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold font-mono transition-colors ${isWatermarkEnabled ? 'text-teal-400' : 'text-zinc-600'}`}>T_</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Görselinizin sağ alt köşesine yarı saydam şık bir koruyucu imza ya da marka metni ekler.
              </p>
            </div>
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
              className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 space-y-4 shadow-xl relative overflow-hidden backdrop-blur-sm"
              id="guest-progress-widget"
            >
              {/* Decorative soft backdrop glow lights */}
              <div className="absolute -right-12 -top-12 h-44 w-44 bg-teal-500/10 rounded-full filter blur-2xl pointer-events-none"></div>
              <div className="absolute -left-12 -bottom-12 h-44 w-44 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse"></span>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      Misafir Kullanıcı Limiti
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                    Kayıt olmadan yükleme yapıyorsunuz. Kalan yükleme hakkınız: <span className="text-teal-400 font-extrabold">{guestStats.remaining}</span> adet.
                  </p>
                </div>
                
                <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-base font-black text-white font-mono">
                      {guestStats.count} <span className="text-zinc-500 font-normal">/ {guestStats.limit}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Yüklenen Resim</span>
                  </div>
                  
                  {/* Premium-like Register CTA Button */}
                  <a 
                    href="/kayit" 
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-450 to-teal-400 hover:from-teal-400 hover:to-emerald-400 px-4 py-2 text-xs font-black text-zinc-950 hover:shadow-lg hover:shadow-teal-500/10 active:scale-95 transition-all duration-200"
                  >
                    <span>Üye Ol</span>
                    <Sparkles className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-zinc-900/90 border border-zinc-800/80 p-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] z-10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (guestStats.count / guestStats.limit) * 100)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className={`h-full rounded-full relative transition-all duration-300 ${
                    guestStats.remaining === 0 
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.3)]' 
                      : guestStats.remaining <= 1 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
                        : 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.2)]'
                  }`}
                />
              </div>

              {/* Limit Status Alerts */}
              <div className="relative z-10">
                {guestStats.remaining === 0 ? (
                  <div className="text-[11px] text-red-400 font-semibold flex items-center gap-2 pt-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-red-500/10 text-xs">⚠️</span>
                    <span>Misafir limitiniz doldu! Sınırsız yükleme ve 100 MB dosya boyutu için ücretsiz üye olun.</span>
                  </div>
                ) : guestStats.remaining <= 1 ? (
                  <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-2 pt-1 animate-pulse">
                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-500/10 text-xs">⚡</span>
                    <span>Son 1 yükleme hakkınız kaldı! Ücretsiz üye olarak 100 MB limitiyle sınırsız yüklemeye geçin.</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500 flex items-center gap-2 pt-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 text-xs">💡</span>
                    <span>Saniyeler içinde kayıt olarak 100 MB üye limitinden hemen yararlanabilirsiniz.</span>
                  </div>
                )}
              </div>
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
          {/* Multiple Upload Results Gallery Navigation (Tabs) */}
          {results.length > 1 && (
            <div className="flex flex-col gap-2 pb-4 border-b border-zinc-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Yüklenen Görseller ({results.length} Adet)
              </span>
              <div className="flex items-center gap-3 overflow-x-auto pb-1.5 custom-scrollbar animate-fadeIn">
                {results.map((res, index) => (
                  <button
                    key={res.id}
                    onClick={() => {
                      setActiveResultIndex(index);
                      setShowBulkCodes(false);
                    }}
                    className={`relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      activeResultIndex === index && !showBulkCodes
                        ? 'border-teal-400 scale-[1.05]'
                        : 'border-zinc-800/80 opacity-60 hover:opacity-100 hover:border-zinc-700'
                    }`}
                  >
                    <img
                      src={res.directUrl}
                      alt={res.filename}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    {activeResultIndex === index && !showBulkCodes && (
                      <span className="absolute inset-0 bg-teal-500/10 flex items-center justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400"></span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center rounded-md bg-teal-400/10 px-2.5 py-1 text-xs font-semibold text-teal-400 ring-1 ring-inset ring-teal-400/20 mb-2 animate-pulse">
                ✓ {results.length > 1 ? 'Tüm Görseller Yüklendi' : 'Yükleme Başarılı'}
              </span>
              {result && (
                <>
                  <h3 className="text-lg font-bold text-white truncate max-w-md">{result.filename}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Boyut: {formatSize(result.bytes)} • Boyutlar: {result.width}x{result.height}px
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              {result && (
                <button
                  onClick={() => onUploadSuccess(result.id)}
                  className="flex items-center space-x-1.5 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-teal-400 transition-all duration-200"
                  id="result-view-btn"
                >
                  <Eye className="h-4 w-4" />
                  <span>Resim Sayfasını Aç</span>
                </button>
              )}
              <button
                onClick={resetUploads}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-200"
                id="result-upload-more-btn"
              >
                Yeni Yükle
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Thumbnail Preview */}
            <div className="md:col-span-2 flex flex-col items-center justify-center bg-zinc-900/50 rounded-xl border border-zinc-900 p-4 min-h-[220px]">
              {result && (
                <img
                  src={result.directUrl}
                  alt={result.filename}
                  referrerPolicy="no-referrer"
                  className="max-h-56 max-w-full rounded-lg object-contain shadow-md transition-all duration-300"
                />
              )}
            </div>

            {/* Embed Codes inputs */}
            <div className="md:col-span-3 space-y-4">
              
              {results.length > 1 && (
                <div className="flex bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80 gap-1">
                  <button
                    type="button"
                    onClick={() => setShowBulkCodes(false)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !showBulkCodes
                        ? 'bg-zinc-850 text-teal-400 border border-zinc-700/60 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Tekil Görsel Kodları
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkCodes(true)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      showBulkCodes
                        ? 'bg-zinc-850 text-teal-400 border border-zinc-700/60 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Toplu Görsel Kodları ({results.length})
                  </button>
                </div>
              )}

              {!showBulkCodes ? (
                <>
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
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleCopy(embedCodes?.page || '', 'page', 'Görsel İzleme Sayfası Linki')}
                        className={`absolute right-1 top-1 bottom-1 px-2.5 rounded transition-all duration-200 flex items-center justify-center ${
                          copiedField === 'page'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={copiedField === 'page' ? 'checked' : 'copy'}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                          >
                            {copiedField === 'page' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
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
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleCopy(embedCodes?.direct || '', 'direct', 'Doğrudan Resim Linki')}
                        className={`absolute right-1 top-1 bottom-1 px-2.5 rounded transition-all duration-200 flex items-center justify-center ${
                          copiedField === 'direct'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={copiedField === 'direct' ? 'checked' : 'copy'}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                          >
                            {copiedField === 'direct' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
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
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleCopy(embedCodes?.html || '', 'html', 'HTML Embed Kodu')}
                        className={`absolute right-1 top-1 bottom-1 px-2.5 rounded transition-all duration-200 flex items-center justify-center ${
                          copiedField === 'html'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={copiedField === 'html' ? 'checked' : 'copy'}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                          >
                            {copiedField === 'html' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
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
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleCopy(embedCodes?.bbcode || '', 'bbcode', 'BBCode Forum Kodu')}
                        className={`absolute right-1 top-1 bottom-1 px-2.5 rounded transition-all duration-200 flex items-center justify-center ${
                          copiedField === 'bbcode'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={copiedField === 'bbcode' ? 'checked' : 'copy'}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                          >
                            {copiedField === 'bbcode' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
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
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleCopy(embedCodes?.markdown || '', 'markdown', 'Markdown Embed Kodu')}
                        className={`absolute right-1 top-1 bottom-1 px-2.5 rounded transition-all duration-200 flex items-center justify-center ${
                          copiedField === 'markdown'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={copiedField === 'markdown' ? 'checked' : 'copy'}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                          >
                            {copiedField === 'markdown' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Bulk Image Page links */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                      <LinkIcon className="h-3.5 w-3.5 text-teal-400" />
                      Tüm Görsel İzleme Sayfası Linkleri ({results.length})
                    </label>
                    <div className="relative flex items-start">
                      <textarea
                        readOnly
                        rows={3}
                        value={bulkEmbedCodes?.page}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 pr-10 text-xs font-mono text-zinc-200 focus:border-teal-500 focus:outline-none resize-none"
                      />
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleCopy(bulkEmbedCodes?.page || '', 'bulk-page', 'Tüm Görsel İzleme Sayfası Linkleri')}
                        className={`absolute right-1 top-1 bottom-1 px-2.5 rounded transition-all duration-200 flex items-center justify-center ${
                          copiedField === 'bulk-page'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={copiedField === 'bulk-page' ? 'checked' : 'copy'}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                          >
                            {copiedField === 'bulk-page' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>

                  {/* Bulk Direct Links */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                      <FileImage className="h-3.5 w-3.5 text-teal-400" />
                      Tüm Doğrudan Resim Linkleri ({results.length})
                    </label>
                    <div className="relative flex items-start">
                      <textarea
                        readOnly
                        rows={3}
                        value={bulkEmbedCodes?.direct}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 pr-10 text-xs font-mono text-zinc-200 focus:border-teal-500 focus:outline-none resize-none"
                      />
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleCopy(bulkEmbedCodes?.direct || '', 'bulk-direct', 'Tüm Doğrudan Resim Linkleri')}
                        className={`absolute right-1 top-1 bottom-1 px-2.5 rounded transition-all duration-200 flex items-center justify-center ${
                          copiedField === 'bulk-direct'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={copiedField === 'bulk-direct' ? 'checked' : 'copy'}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                          >
                            {copiedField === 'bulk-direct' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>

                  {/* Bulk HTML Embed Codes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                      <Code className="h-3.5 w-3.5 text-teal-400" />
                      Tüm HTML Embed Kodları ({results.length})
                    </label>
                    <div className="relative flex items-start">
                      <textarea
                        readOnly
                        rows={3}
                        value={bulkEmbedCodes?.html}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 pr-10 text-xs font-mono text-zinc-200 focus:border-teal-500 focus:outline-none resize-none"
                      />
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleCopy(bulkEmbedCodes?.html || '', 'bulk-html', 'Tüm HTML Embed Kodları')}
                        className={`absolute right-1 top-1 bottom-1 px-2.5 rounded transition-all duration-200 flex items-center justify-center ${
                          copiedField === 'bulk-html'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={copiedField === 'bulk-html' ? 'checked' : 'copy'}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                          >
                            {copiedField === 'bulk-html' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>

                  {/* Bulk BBCode */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                      Tüm BBCode Forum Kodları ({results.length})
                    </label>
                    <div className="relative flex items-start">
                      <textarea
                        readOnly
                        rows={3}
                        value={bulkEmbedCodes?.bbcode}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 pr-10 text-xs font-mono text-zinc-200 focus:border-teal-500 focus:outline-none resize-none"
                      />
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleCopy(bulkEmbedCodes?.bbcode || '', 'bulk-bbcode', 'Tüm BBCode Forum Kodları')}
                        className={`absolute right-1 top-1 bottom-1 px-2.5 rounded transition-all duration-200 flex items-center justify-center ${
                          copiedField === 'bulk-bbcode'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={copiedField === 'bulk-bbcode' ? 'checked' : 'copy'}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                          >
                            {copiedField === 'bulk-bbcode' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>

                  {/* Bulk Markdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                      Tüm Markdown Embed Kodları ({results.length})
                    </label>
                    <div className="relative flex items-start">
                      <textarea
                        readOnly
                        rows={3}
                        value={bulkEmbedCodes?.markdown}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 pr-10 text-xs font-mono text-zinc-200 focus:border-teal-500 focus:outline-none resize-none"
                      />
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleCopy(bulkEmbedCodes?.markdown || '', 'bulk-markdown', 'Tüm Markdown Embed Kodları')}
                        className={`absolute right-1 top-1 bottom-1 px-2.5 rounded transition-all duration-200 flex items-center justify-center ${
                          copiedField === 'bulk-markdown'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={copiedField === 'bulk-markdown' ? 'checked' : 'copy'}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                          >
                            {copiedField === 'bulk-markdown' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>
                </>
              )}

            </div>

          </div>
        </motion.div>
      )}

      {/* Floating Copy Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 rounded-2xl border border-teal-500/30 bg-zinc-950/95 px-5 py-3.5 shadow-2xl backdrop-blur-md max-w-sm"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Check className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Kopyalandı</p>
              <p className="text-xs font-semibold text-zinc-100 leading-snug">{showToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advertisement Overlay Modal */}
      <AnimatePresence>
        {showAdModal && systemStatus?.adEnabled && (!user || !user.isPremium) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/[0.03] rounded-full filter blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">
                    Sponsorlu Reklam
                  </span>
                </div>
                {adCountdown > 0 ? (
                  <span className="text-xs font-bold text-zinc-500 font-mono">
                    Reklamı Geç ({adCountdown}s)
                  </span>
                ) : (
                  <button
                    onClick={() => setShowAdModal(false)}
                    className="text-xs font-black text-amber-400 hover:text-amber-300 transition-colors bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/10 flex items-center gap-1.5"
                  >
                    <span>Sponsoru Kapat / Geç</span>
                    <span>→</span>
                  </button>
                )}
              </div>

              {/* Advertisement Image / Container */}
              <div className="relative rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-900/60 aspect-video group shadow-inner">
                {systemStatus.adImageUrl ? (
                  <img
                    src={systemStatus.adImageUrl}
                    alt="Sponsorlu Görsel"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 font-medium">Sponsorlu Görsel</div>
                )}
                <span className="absolute top-3 right-3 rounded bg-black/80 px-2 py-0.5 text-[9px] font-black text-white tracking-widest uppercase">
                  Sponsorlu
                </span>
              </div>

              {/* Text content */}
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-lg font-extrabold text-white leading-tight">
                  {systemStatus.adTitle || "Sponsorlu Reklam"}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  {systemStatus.adDescription || "Resim yükleme hizmetimizi ücretsiz sunabilmemiz için sponsorumuzu ziyaret edin."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-zinc-900">
                <button
                  onClick={() => {
                    if (adCountdown === 0) {
                      setShowAdModal(false);
                    }
                  }}
                  disabled={adCountdown > 0}
                  className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs py-3.5 disabled:opacity-40 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed transition-all active:scale-95 text-center"
                >
                  {adCountdown > 0 ? `Reklamı Kapat (${adCountdown}s)` : 'Reklamı Kapat ve Görsele Dön'}
                </button>
                <a
                  href={systemStatus.adTargetUrl || "https://ai.studio/build"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowAdModal(false)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 text-zinc-950 font-black text-xs py-3.5 flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-amber-500/10 hover:brightness-110 active:scale-95 transition-all text-center animate-pulse"
                >
                  <span>{systemStatus.adButtonText || "Sponsoru Ziyaret Et"}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
