import { useState, useEffect, useRef } from 'react';
import { 
  Crop, 
  RotateCw, 
  Sliders, 
  Sparkles, 
  X, 
  Check, 
  Lock, 
  Undo,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

interface ImageEditorProps {
  file: File;
  user: User | null;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
  onDirectUpload: () => void; // Normal upload without changes
}

interface FilterOption {
  id: string;
  name: string;
  class: string;
  filterString: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'none', name: 'Normal', class: '', filterString: 'none' },
  { id: 'grayscale', name: 'Siyah-Beyaz', class: 'grayscale', filterString: 'grayscale(100%)' },
  { id: 'sepia', name: 'Sepya', class: 'sepia', filterString: 'sepia(100%)' },
  { id: 'vintage', name: 'Eski (Vintage)', class: 'contrast-125 brightness-95 sepia-50', filterString: 'sepia(50%) contrast(120%) brightness(95%)' },
  { id: 'warm', name: 'Sıcak', class: 'sepia-25 saturate-150', filterString: 'sepia(30%) saturate(140%)' },
  { id: 'cool', name: 'Soğuk', class: 'saturate-75 hue-rotate-15', filterString: 'saturate(80%) hue-rotate(15deg)' },
  { id: 'invert', name: 'Ters Renkler', class: 'invert', filterString: 'invert(100%)' },
  { id: 'high-contrast', name: 'Yüksek Kontrast', class: 'contrast-150', filterString: 'contrast(150%)' },
  { id: 'bright', name: 'Aydınlık', class: 'brightness-125', filterString: 'brightness(125%)' },
];

export default function ImageEditor({ file, user, onSave, onCancel, onDirectUpload }: ImageEditorProps) {
  const isPremium = !!user?.isPremium;
  const [imageSrc, setImageSrc] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'crop' | 'rotate' | 'filter'>('filter');
  
  // Editor States
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [activeFilter, setActiveFilter] = useState<string>('none');
  
  // Crop margins in percentages (0 to 50)
  const [cropLeft, setCropLeft] = useState<number>(0);
  const [cropRight, setCropRight] = useState<number>(0);
  const [cropTop, setCropTop] = useState<number>(0);
  const [cropBottom, setCropBottom] = useState<number>(0);

  // Premium Modal state
  const [showPremiumPrompt, setShowPremiumPrompt] = useState<boolean>(false);
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image file as data URL
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
        
        // Get dimensions
        const img = new Image();
        img.onload = () => {
          setImgDimensions({ w: img.width, h: img.height });
        };
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }, [file]);

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    setActiveFilter('none');
    setCropLeft(0);
    setCropRight(0);
    setCropTop(0);
    setCropBottom(0);
  };

  const applyCropPreset = (ratio: number | 'original') => {
    if (ratio === 'original' || imgDimensions.w === 0) {
      setCropLeft(0);
      setCropRight(0);
      setCropTop(0);
      setCropBottom(0);
      return;
    }

    const imgRatio = imgDimensions.w / imgDimensions.h;

    if (ratio > imgRatio) {
      // Crop Top & Bottom
      const newHeight = imgDimensions.w / ratio;
      const cropTotal = (imgDimensions.h - newHeight) / imgDimensions.h;
      const cropVal = Math.min(45, Math.max(0, Math.round((cropTotal / 2) * 100)));
      setCropTop(cropVal);
      setCropBottom(cropVal);
      setCropLeft(0);
      setCropRight(0);
    } else {
      // Crop Left & Right
      const newWidth = imgDimensions.h * ratio;
      const cropTotal = (imgDimensions.w - newWidth) / imgDimensions.w;
      const cropVal = Math.min(45, Math.max(0, Math.round((cropTotal / 2) * 100)));
      setCropLeft(cropVal);
      setCropRight(cropVal);
      setCropTop(0);
      setCropBottom(0);
    }
  };

  const handleSaveClick = () => {
    if (!isPremium) {
      setShowPremiumPrompt(true);
      return;
    }

    // Apply edits via canvas
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Calculate crop values in pixels
      const pxLeft = img.width * (cropLeft / 100);
      const pxRight = img.width * (cropRight / 100);
      const pxTop = img.height * (cropTop / 100);
      const pxBottom = img.height * (cropBottom / 100);

      const croppedW = img.width - pxLeft - pxRight;
      const croppedH = img.height - pxTop - pxBottom;

      // Handle rotated canvas dimensions
      const isSwapped = rotation === 90 || rotation === 270;
      canvas.width = isSwapped ? croppedH : croppedW;
      canvas.height = isSwapped ? croppedW : croppedH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onSave(file);
        return;
      }

      // 1. Apply Filters on Context
      const selectedFilter = FILTER_OPTIONS.find(f => f.id === activeFilter);
      if (selectedFilter && selectedFilter.filterString !== 'none') {
        ctx.filter = selectedFilter.filterString;
      }

      // 2. Translate and Rotate Context
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // 3. Draw Image
      // We must map rotated canvas coordinates back
      const drawW = croppedW;
      const drawH = croppedH;
      ctx.drawImage(
        img,
        pxLeft, pxTop, croppedW, croppedH, // source rect
        -drawW / 2, -drawH / 2, drawW, drawH // destination rect at center
      );

      // Export file
      const format = file.type || 'image/jpeg';
      canvas.toBlob((blob) => {
        if (blob) {
          const editedFile = new File([blob], `edited_${file.name}`, {
            type: format,
            lastModified: Date.now()
          });
          onSave(editedFile);
        } else {
          onSave(file);
        }
      }, format, 0.95);
    };
    img.src = imageSrc;
  };

  const activeFilterObj = FILTER_OPTIONS.find(f => f.id === activeFilter);

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-6" id="image-editor-panel">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 fill-amber-500/20" /> Premium Özellik
            </span>
            <h2 className="text-base font-black text-white">Resim Düzenleyici</h2>
          </div>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">Yüklemeden önce görselinizi şekillendirin ve zenginleştirin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer font-bold"
            title="Tüm ayarları sıfırla"
          >
            <Undo className="h-3.5 w-3.5" />
            <span>Sıfırla</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Visual Preview Sandbox */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 min-h-[320px] relative overflow-hidden select-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:16px_16px] opacity-30 pointer-events-none" />
          
          {imageSrc ? (
            <div className="relative max-w-full max-h-[300px] flex items-center justify-center">
              {/* Outer container with crop masks */}
              <div 
                className="relative overflow-hidden transition-all duration-300"
                style={{
                  clipPath: `inset(${cropTop}% ${cropRight}% ${cropBottom}% ${cropLeft}%)`,
                }}
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Editor Önizleme"
                  className={`max-w-full max-h-[300px] object-contain rounded-lg transition-transform duration-300 shadow-xl`}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    filter: activeFilterObj?.filterString || 'none',
                  }}
                />
              </div>

              {/* Crop Indicator borders (non-destructive visual preview) */}
              {(cropLeft > 0 || cropRight > 0 || cropTop > 0 || cropBottom > 0) && (
                <div 
                  className="absolute pointer-events-none border-2 border-dashed border-teal-400 rounded-lg animate-pulse"
                  style={{
                    top: `${cropTop}%`,
                    left: `${cropLeft}%`,
                    right: `${cropRight}%`,
                    bottom: `${cropBottom}%`,
                  }}
                />
              )}
            </div>
          ) : (
            <div className="h-10 w-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          )}

          {/* Quick Info */}
          <div className="mt-4 flex items-center gap-4 text-[10px] text-zinc-500 font-mono">
            {imgDimensions.w > 0 && (
              <span>Çözünürlük: {imgDimensions.w}x{imgDimensions.h} px</span>
            )}
            {rotation > 0 && (
              <span className="text-teal-400">Döndürme: {rotation}°</span>
            )}
            {activeFilter !== 'none' && (
              <span className="text-teal-400">Filtre: {activeFilterObj?.name}</span>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Control Panel Tabs */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative">
          
          {/* Lock overlay if not premium */}
          {!isPremium && (
            <div className="absolute top-12 left-0 right-0 bottom-0 bg-zinc-950/20 backdrop-blur-[1px] rounded-b-2xl z-20 pointer-events-none flex flex-col items-center justify-center p-6 text-center">
              {/* Subtle indicator that they can still customize but can't save */}
            </div>
          )}

          {/* Controls Navigation tabs */}
          <div className="flex border-b border-zinc-900 p-1 bg-zinc-950 rounded-xl">
            <button
              onClick={() => setActiveTab('filter')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'filter'
                  ? 'bg-zinc-900 text-teal-400 border border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Filtreler</span>
            </button>
            <button
              onClick={() => setActiveTab('crop')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'crop'
                  ? 'bg-zinc-900 text-teal-400 border border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Crop className="h-3.5 w-3.5" />
              <span>Kırpma</span>
            </button>
            <button
              onClick={() => setActiveTab('rotate')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'rotate'
                  ? 'bg-zinc-900 text-teal-400 border border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Döndürme</span>
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="min-h-[160px] flex flex-col justify-center">
            {activeTab === 'filter' && (
              <div className="grid grid-cols-3 gap-2" id="filter-options-grid">
                {FILTER_OPTIONS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center cursor-pointer ${
                      activeFilter === filter.id
                        ? 'border-teal-500 bg-teal-500/5 text-teal-400 font-extrabold'
                        : 'border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-[11px] font-bold line-clamp-1">{filter.name}</div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'crop' && (
              <div className="space-y-4" id="crop-sliders-panel">
                {/* Crop presets */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button 
                    onClick={() => applyCropPreset('original')}
                    className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 hover:text-white transition-all font-bold cursor-pointer"
                  >
                    Orijinal / Sıfırla
                  </button>
                  <button 
                    onClick={() => applyCropPreset(1)}
                    className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 hover:text-white transition-all font-bold cursor-pointer"
                  >
                    Kare (1:1)
                  </button>
                  <button 
                    onClick={() => applyCropPreset(16/9)}
                    className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 hover:text-white transition-all font-bold cursor-pointer"
                  >
                    Sinematik (16:9)
                  </button>
                  <button 
                    onClick={() => applyCropPreset(4/3)}
                    className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 hover:text-white transition-all font-bold cursor-pointer"
                  >
                    Klasik (4:3)
                  </button>
                  <button 
                    onClick={() => applyCropPreset(4/5)}
                    className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 hover:text-white transition-all font-bold cursor-pointer"
                  >
                    Portre (4:5)
                  </button>
                </div>

                {/* Slider inputs */}
                <div className="space-y-3">
                  {/* Left Crop */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                      <span>SOL KENAR</span>
                      <span>%{cropLeft}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="45" 
                      value={cropLeft}
                      onChange={(e) => setCropLeft(Number(e.target.value))}
                      className="w-full accent-teal-400 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Right Crop */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                      <span>SAĞ KENAR</span>
                      <span>%{cropRight}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="45" 
                      value={cropRight}
                      onChange={(e) => setCropRight(Number(e.target.value))}
                      className="w-full accent-teal-400 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Top Crop */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                      <span>ÜST KENAR</span>
                      <span>%{cropTop}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="45" 
                      value={cropTop}
                      onChange={(e) => setCropTop(Number(e.target.value))}
                      className="w-full accent-teal-400 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Bottom Crop */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                      <span>ALT KENAR</span>
                      <span>%{cropBottom}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="45" 
                      value={cropBottom}
                      onChange={(e) => setCropBottom(Number(e.target.value))}
                      className="w-full accent-teal-400 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rotate' && (
              <div className="flex flex-col items-center justify-center p-4 gap-4" id="rotate-controls-panel">
                <button
                  onClick={handleRotate}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-teal-500/30 hover:bg-teal-500/5 text-zinc-400 hover:text-teal-400 transition-all duration-300 w-36 cursor-pointer"
                >
                  <RotateCw className="h-8 w-8 mb-2" />
                  <span className="text-xs font-black">90° Döndür</span>
                </button>
                <p className="text-[10px] text-zinc-500 text-center font-medium">Her tıklamada görseli saat yönünde 90 derece döndürür.</p>
              </div>
            )}
          </div>

          {/* Disclaimer for non-premium trying to use features */}
          {!isPremium && (
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 flex items-start gap-2 text-[11px] text-amber-500 leading-normal">
              <Lock className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Düzenleme Modu Aktif:</strong> Ayarları dilediğiniz gibi deneyebilirsiniz. Ancak kaydetmek ve bu şekilde yüklemek için <strong>Premium Paket</strong> gerekir.
              </span>
            </div>
          )}

        </div>
      </div>

      {/* Editor Actions Footer */}
      <div className="border-t border-zinc-900 pt-5 flex flex-col sm:flex-row justify-between gap-3 items-center">
        <button
          onClick={onCancel}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
        >
          Değişiklikleri İptal Et
        </button>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          <button
            onClick={onDirectUpload}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer border border-zinc-800"
          >
            Düzenlemeden Doğrudan Yükle
          </button>
          
          <button
            onClick={handleSaveClick}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-zinc-950 text-xs font-black transition-all cursor-pointer shadow-lg shadow-teal-500/10 flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>Değişiklikleri Kaydet ve Yükle</span>
          </button>
        </div>
      </div>

      {/* PREMIUM LOCK PROMPT MODAL */}
      <AnimatePresence>
        {showPremiumPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowPremiumPrompt(false)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              {/* Premium Header */}
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 shadow-lg shadow-amber-500/20">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-white">🔒 Premium Görsel Düzenleyici</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                  Yüklemeden önce resimlerinizi kırpma, döndürme ve özel filtreler uygulama özellikleri yalnızca <strong>Premium Paket</strong> üyelerimize özeldir.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="bg-zinc-900/40 border border-zinc-900/60 rounded-2xl p-4 space-y-3 text-xs text-zinc-300">
                <div className="flex items-center gap-2.5">
                  <span className="text-amber-500">✦</span>
                  <span>9 Özel Filtre Seçeneği (Siyah-Beyaz, Vintage vb.)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-amber-500">✦</span>
                  <span>Özel ve Hazır Oranlı (1:1, 16:9) Kusursuz Kırpma</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-amber-500">✦</span>
                  <span>90 Derece ve Katları Dönüş İmkanı</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-amber-500">✦</span>
                  <span>Sınırsız Kullanım ve Full-Quality Çözünürlük Kaybı Yaşamadan Kayıt</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => setShowPremiumPrompt(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Geri Dön
                </button>
                <a
                  href="/premium"
                  className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 text-xs font-black transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  <span>Premium Paketleri Gör</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
