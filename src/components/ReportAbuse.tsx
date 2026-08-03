import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Send, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function ReportAbuse() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [imageId, setImageId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reason, setReason] = useState('Telif Hakkı İhlali (DMCA)');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const qImageId = searchParams.get('imageId');
    const qImageUrl = searchParams.get('imageUrl');
    if (qImageId) setImageId(qImageId);
    if (qImageUrl) setImageUrl(qImageUrl);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName || !reporterEmail || !reason || !description) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: imageId || null,
          imageUrl: imageUrl || null,
          reporterName,
          reporterEmail,
          reason,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Rapor gönderilirken bir hata oluştu.');
      }

      setSuccess(true);
      // Reset form
      setDescription('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Bir teknik sorun oluştu, lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12" id="report-abuse-container">
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 shadow-inner">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Kötüye Kullanım Bildir (DMCA / İhlal)</h1>
        <p className="text-zinc-400 max-w-md mx-auto text-sm leading-relaxed">
          Platformumuzdaki telif hakkı ihlallerini, yasa dışı içerikleri veya topluluk standartlarına uymayan görselleri buradan hızlıca bildirebilirsiniz.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-zinc-850 bg-zinc-950/40 p-6 sm:p-8 shadow-xl backdrop-blur-sm"
      >
        {success ? (
          <div className="text-center py-8 space-y-4" id="report-success-state">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Bildiriminiz Başarıyla Alındı</h2>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                Bildiriminiz inceleme ekibimize iletilmiştir. Gerekli kontroller en kısa sürede yapılarak ihlale konu görsel hakkında işlem başlatılacaktır.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-4">
              <button
                onClick={() => setSuccess(false)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Yeni Bildirim Yap
              </button>
              <button
                onClick={() => navigate('/')}
                className="rounded-lg bg-teal-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-teal-400 transition-colors cursor-pointer"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" id="report-form">
            
            {/* Form Warning Header */}
            <div className="rounded-xl border border-red-950/40 bg-red-950/10 p-4 text-xs text-red-400 leading-relaxed flex gap-2.5">
              <span className="text-base select-none">⚖️</span>
              <div>
                <strong className="font-semibold block mb-0.5">Yasal Sorumluluk Uyarısı</strong>
                5651 sayılı kanun ve DMCA kapsamında asılsız telif bildirimleri veya kötü niyetli ihbarlar yasal sorumluluk doğurabilir. Lütfen sunduğunuz bilgilerin doğruluğundan emin olunuz.
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400" id="report-error-alert">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider" htmlFor="reporter-name">Adınız Soyadınız *</label>
                <input
                  id="reporter-name"
                  type="text"
                  required
                  placeholder="Can Demir"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider" htmlFor="reporter-email">E-Posta Adresiniz *</label>
                <input
                  id="reporter-email"
                  type="email"
                  required
                  placeholder="can@example.com"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reason selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider" htmlFor="report-reason">İhbar Nedeni *</label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="Telif Hakkı İhlali (DMCA)">Telif Hakkı İhlali (DMCA)</option>
                  <option value="Uygunsuz / Müstehcen İçerik">Uygunsuz / Müstehcen İçerik</option>
                  <option value="Kişisel Hakların İhlali">Kişisel Hakların İhlali / İfşa</option>
                  <option value="Dolandırıcılık / Spam">Dolandırıcılık / Spam</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              {/* Optional Image ID */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider" htmlFor="report-image-id">Görsel ID (İsteğe Bağlı)</label>
                <input
                  id="report-image-id"
                  type="text"
                  placeholder="e.g. 5f83ae2b"
                  value={imageId}
                  onChange={(e) => setImageId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Optional Image URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider" htmlFor="report-image-url">Görsel Doğrudan Bağlantısı (İsteğe Bağlı)</label>
              <input
                id="report-image-url"
                type="url"
                placeholder="https://resimyukle.com/api/local-images/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Description Details */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider" htmlFor="report-description">Açıklama &amp; Detaylar *</label>
              <textarea
                id="report-description"
                required
                rows={5}
                placeholder="Telif hakkı sahibi olduğunuzu doğrulayan belgeleri, iddia ettiğiniz ihlali veya diğer yasal açıklamaları detaylıca buraya yazınız..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-y"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              id="report-submit-btn"
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>İhbar İletiliyor...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>İhlal Bildirimini İlet</span>
                </>
              )}
            </button>

          </form>
        )}
      </motion.div>
    </div>
  );
}
