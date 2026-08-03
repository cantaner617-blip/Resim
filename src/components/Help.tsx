import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, ChevronLeft, Search, Mail, MessageSquare, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export default function Help() {
  const [openId, setOpenId] = useState<number | null>(1);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs: FaqItem[] = [
    {
      id: 1,
      question: "Görsel yüklemek için üye olmak zorunda mıyım?",
      answer: "Hayır, AnındaResim'i kullanmak için üye olmanız zorunlu değildir. Ana sayfamızdaki yükleme alanını kullanarak anında misafir olarak resim yükleyebilir ve paylaşım linklerinizi alabilirsiniz. Ancak ücretsiz üye olduğunuzda, yüklediğiniz tüm görselleri tek bir panelden (Galerim) yönetebilir, silebilir ve daha yüksek dosya limiti avantajlarından yararlanabilirsiniz."
    },
    {
      id: 2,
      question: "Maksimum dosya yükleme boyutu ne kadardır?",
      answer: "Misafir kullanıcılarımız için tek seferde yükleme limiti görsel başına 20 MB'tır. Ücretsiz kayıtlı üyelerimiz için ise bu limit görsel başına tam 100 MB'a yükseltilmektedir. Desteklenen formatlar arasında JPEG, PNG, GIF, BMP, WEBP, SVG ve TIFF bulunmaktadır."
    },
    {
      id: 3,
      question: "Yüklediğim resimler ne kadar süreyle sistemde saklanır?",
      answer: "Yasalara uygun olarak yüklenen tüm görseller, siz silmediğiniz sürece platformumuzda süresiz ve tamamen ücretsiz olarak saklanır. Herhangi bir görüntülenme kotası veya zaman aşımı sınırı uygulanmamaktadır."
    },
    {
      id: 4,
      question: "Yüklediğim bir resmi nasıl silebilirim?",
      answer: "Eğer üye olarak yükleme yaptıysanız, 'Galerim' sekmesine gidip silmek istediğiniz görselin altındaki silme butonuna tıklayarak görseli anında sistemden kaldırabilirsiniz. Misafir olarak yüklediğiniz resimlerin silinmesi için ise silme linkinizi kaybetmişseniz, iletişim kanallarımızdan görselin linkiyle birlikte bize ulaşarak silme talebinde bulunabilirsiniz."
    },
    {
      id: 5,
      question: "Doğrudan (Direct Link) bağlantı nedir?",
      answer: "Doğrudan bağlantı, görselin arka planda hiçbir reklam veya site arayüzü olmadan doğrudan resim dosyasının kendisini açan linktir (örn: .../uploads/resim.jpg). Bu linki forumlarda, bloglarda, discord gibi sohbet uygulamalarında resmi direkt göstermek için güvenle kullanabilirsiniz."
    },
    {
      id: 6,
      question: "Telif hakkı ihlali bildirimlerini nereye yapmalıyım?",
      answer: "Size ait telifli bir içeriğin izinsiz paylaşıldığını düşünüyorsanız, telif ispat belgesi ve ilgili görselin linki ile birlikte iremsaltanat002001@gmail.com adresinden bizimle iletişime geçebilirsiniz. Talepleriniz hukuk departmanımız tarafından en geç 24 saat içinde sonuçlandırılacaktır."
    }
  ];

  const filteredFaqs = faqs.filter(
    item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto space-y-8 py-4"
      id="help-page"
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

      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <HelpCircle className="h-8 w-8 text-teal-400" />
          Yardım &amp; SSS
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
          Merak ettiğiniz tüm soruların cevapları, hızlı ipuçları ve platform rehberimiz. Aramak istediğiniz konuyu yazarak anında filtreleyebilirsiniz.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto" id="faq-search-wrapper">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sorularda arama yapın..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-zinc-850 bg-zinc-900/50 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        
        {/* FAQ Accordion List (Left/Main) */}
        <div className="md:col-span-2 space-y-3" id="faq-accordion-list">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div 
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen 
                      ? 'bg-zinc-950/40 border-teal-500/20 shadow-lg shadow-teal-950/5' 
                      : 'bg-zinc-950/15 border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white cursor-pointer select-none"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-teal-400 shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0 ml-4" />
                    )}
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-900/40">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-900 p-8 text-center text-sm text-zinc-500">
              Aramanızla eşleşen bir soru bulunamadı. Lütfen başka anahtar kelimeler deneyin.
            </div>
          )}
        </div>

        {/* Contact/Help Support Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-white tracking-wider uppercase flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-teal-400" />
              Destek Alın
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sorunuza burada cevap bulamadıysanız veya özel bir silme talebiniz varsa, ekibimiz size yardımcı olmaktan memnuniyet duyacaktır.
            </p>

            <div className="pt-2">
              <a
                href="mailto:iremsaltanat002001@gmail.com"
                className="flex items-center justify-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold py-3 w-full transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>E-posta Gönder</span>
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Shield className="h-4 w-4 text-emerald-400" />
              Güvenlik ve İletişim
            </div>
            <p className="leading-relaxed">
              E-postalarımıza en geç 12 ila 24 saat içinde dönüş sağlanmaktadır. Tüm başvurularınız titizlikle incelenmektedir.
            </p>
          </div>
        </div>

      </div>

    </motion.div>
  );
}
