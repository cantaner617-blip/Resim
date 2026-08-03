import { Link } from 'react-router-dom';
import { ShieldAlert, FileText, Scale, EyeOff, Lock, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Terms() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto space-y-8 py-4"
      id="terms-page"
    >
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Kullanım Şartları &amp; Hizmet Standartları
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          ResimYükle platformunu kullanırken uymanız gereken kurallar, yasal sorumluluklar ve sunduğumuz hizmet kalitesi standartları.
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        {/* Rules column (Left/Main) */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="h-5 w-5 text-teal-400" />
              1. Kabul Edilebilir Kullanım Politikası
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              ResimYükle, yasalara uygun her türlü görsel içeriğin paylaşımı için ücretsiz hizmet vermektedir. Ancak aşağıdaki niteliklere sahip içeriklerin platformumuza yüklenmesi kesinlikle yasaktır:
            </p>
            <ul className="space-y-2.5 text-xs text-zinc-400 pl-2">
              <li className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>Telif hakları başkasına ait olan ve izinsiz paylaşılan telifli görseller, logolar ve dijital tasarımlar.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>Şiddet, nefret söylemi, taciz, yasa dışı faaliyetleri teşvik eden veya pornografik nitelikteki içerikler.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>Kişisel verilerin gizliliğini ihlal eden (kimlik kartları, kredi kartı görselleri vb.) hassas belgeler.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>Kötü amaçlı yazılım barındıran veya manipüle edilmiş tehlikeli görsel dosyaları.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-teal-400" />
              2. Fikri Mülkiyet ve Haklar
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Yüklediğiniz tüm görsellerin mülkiyeti ve yasal sorumluluğu tamamen size (yükleyen kişiye) aittir. ResimYükle, yüklediğiniz görseller üzerinde hiçbir mülkiyet iddiasında bulunmaz. Ancak, görsellerin sitenizde veya paylaştığınız yerlerde görüntülenebilmesi için platformumuza barındırma ve dağıtım lisansı vermiş sayılırsınız.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-teal-400" />
              3. Gizlilik ve Veri Güvenliği
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Kullanıcılarımızın gizliliğini son derece önemsiyoruz. Ziyaretçilerin yüklediği görsellere ait meta veriler (EXIF bilgileri, coğrafi konum verileri vb.) gizliliğinizi korumak amacıyla sunucularımızda optimize edilirken güvenli bir şekilde işlenir. Detaylı bilgi için gizlilik sözleşmemizi inceleyebilirsiniz.
            </p>
          </div>
        </div>

        {/* Standards Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-white tracking-wider uppercase flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-400" />
              Hizmet Standartları
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-zinc-200 block">%99.9 Uptime Garantisi</span>
                  <span className="text-zinc-400 block">Gelişmiş bulut altyapımız ile resimleriniz kesintisiz olarak 7/24 erişilebilir durumdadır.</span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-zinc-200 block">Sınırsız Bant Genişliği</span>
                  <span className="text-zinc-400 block">Resimlerinizin görüntülenme trafiği için herhangi bir kota veya ek ücret uygulanmaz.</span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-zinc-200 block">Hızlı Silme Talebi</span>
                  <span className="text-zinc-400 block">Telif hakkı ihlali veya yanlışlıkla yüklenen görseller, bildirim yapılması halinde 24 saat içinde sistemden silinir.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-3 text-xs text-zinc-400">
            <span className="font-bold text-white block">Yasal Uarı:</span>
            <p className="leading-relaxed">
              ResimYükle, 5651 sayılı kanun kapsamında "Yer Sağlayıcı" olarak hizmet vermektedir. Yüklenen yasa dışı içeriklerden platformumuz sorumlu tutulamaz; sorumluluk tamamen yükleyen tarafa aittir.
            </p>
          </div>
        </div>

      </div>

    </motion.div>
  );
}
