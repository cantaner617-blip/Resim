import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Check, 
  CreditCard, 
  Send, 
  HelpCircle, 
  Clock, 
  ShieldCheck, 
  Layers, 
  AlertCircle, 
  MessageSquare,
  Lock,
  Calendar,
  Gift
} from 'lucide-react';
import { User, SystemStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PremiumProps {
  user: User | null;
  systemStatus: SystemStatus | null;
  onRefreshSession: () => void;
}

export default function Premium({ user, systemStatus, onRefreshSession }: PremiumProps) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Bank Transfer state
  const [senderName, setSenderName] = useState('');

  const monthlyPrice = systemStatus?.premiumMonthlyPrice ?? 150;
  const yearlyPrice = systemStatus?.premiumYearlyPrice ?? 1200;
  const discountPercent = Math.round((1 - (yearlyPrice / (monthlyPrice * 12))) * 100);

  const bankName = systemStatus?.bankName ?? 'Akbank';
  const bankIban = systemStatus?.bankIban ?? 'TR56 0004 6000 1580 0745 9931 10';
  const bankReceiver = systemStatus?.bankReceiver ?? 'ANINDARSİM YAZILIM BİLİŞİM LİMİTED ŞİRKETİ';

  const premiumEnabled = systemStatus?.premiumEnabled !== false;

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/giris');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        setError('Lütfen tüm kredi kartı bilgilerini doldurun.');
        return;
      }
    } else {
      if (!senderName) {
        setError('Lütfen havale gönderen ad soyad bilgisini girin.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod: paymentMethod === 'card' ? 'credit_card' : 'bank_transfer',
          senderName,
          cardName
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        onRefreshSession();
      } else {
        setError(data.error || 'Satın alma işlemi sırasında bir sorun oluştu.');
      }
    } catch (err) {
      console.error(err);
      setError('Ağ hatası oluştu. Lütfen bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  if (!premiumEnabled) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center" id="premium-disabled-view">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 sm:p-12 space-y-6 shadow-xl"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-amber-500 border border-zinc-800 mx-auto">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Premium Üyelik Kapalı</h1>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
              Premium üyelik paketlerimiz şu anda geçici olarak yeni alımlara kapatılmıştır. Mevcut premium üyelerin hakları aynen devam etmektedir.
            </p>
          </div>
          <div className="pt-4">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12" id="premium-success-view">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          {/* Confetti Glow Background */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none filter blur-2xl" />
          
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto animate-bounce">
            <Sparkles className="h-8 w-8 fill-amber-400/20" />
          </div>

          <div className="space-y-2 relative z-10">
            <h1 className="text-3xl font-black text-white">Tebrikler, Artık Premium Üyesiniz!</h1>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
              Ödemeniz onaylandı ve Premium üyeliğiniz başarıyla başlatıldı. Sınırsız hız, tamamen reklamsız arayüz ve 25 adete kadar toplu görsel yükleme ayrıcalıklarınız hemen aktif edildi!
            </p>
          </div>

          <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-bold uppercase">Hesap Durumu:</span>
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
                PREMIUM AKTİF
              </span>
            </div>
            <div className="h-px bg-zinc-900" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-bold uppercase">Plan Detayı:</span>
              <span className="font-bold text-zinc-200">{selectedPlan === 'monthly' ? 'Aylık Paket' : 'Yıllık Paket'}</span>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 text-sm font-black shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              Hemen Görsel Yükle
            </Link>
            <Link 
              to="/destek" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
            >
              Özel Destek Talebi
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-12 py-4" id="premium-subscription-page">
      
      {/* Intro visual header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto" id="premium-intro-header">
        <span className="inline-flex items-center space-x-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-amber-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
          <span>Ayrıcalıklar Dünyası</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white leading-none">
          Limitleri Kaldırın, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-300">
            Premium'a Yükselin
          </span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-lg mx-auto">
          Görsel paylaşım deneyiminizi üst seviyeye taşıyacak sınırsız özelliklere, kesintisiz hıza ve öncelikli desteğe kavuşun.
        </p>
      </div>

      {user?.isPremium ? (
        <div className="max-w-xl mx-auto" id="premium-already-active">
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] rounded-full blur-2xl -mr-6 -mt-6" />
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="h-6 w-6 text-amber-400 fill-amber-400/10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Premium Üyeliğiniz Aktif!</h3>
                <p className="text-xs text-zinc-500">Tüm VIP ayrıcalıklarından sonuna kadar yararlanıyorsunuz.</p>
              </div>
            </div>

            <div className="border border-zinc-900 rounded-2xl p-4 bg-zinc-900/10 text-xs space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-semibold">Mevcut Plan:</span>
                <span className="font-bold text-zinc-200 uppercase">{user.premiumPlan === 'yearly' ? 'Yıllık Paket (VIP)' : 'Aylık Paket (Standard)'}</span>
              </div>
              <div className="h-px bg-zinc-900" />
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-semibold">Bitiş Tarihi:</span>
                <span className="font-bold text-zinc-200 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  {user.premiumExpiresAt ? new Date(user.premiumExpiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Süresiz'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                to="/"
                className="inline-flex items-center justify-center py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 text-xs font-black shadow hover:shadow-lg transition-all"
              >
                Görsel Yükle
              </Link>
              <Link
                to="/destek"
                className="inline-flex items-center justify-center py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-xs font-bold"
              >
                7/24 VIP Canlı Destek
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-start" id="premium-purchase-container">
          
          {/* Features and Packages Column (Left) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Features list card */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl" id="premium-features-list">
              <h3 className="text-lg font-extrabold text-white">Premium Üyelik Paket Özellikleri</h3>
              <p className="text-xs text-zinc-500">Premium paket satın aldığınızda aşağıdaki tüm özellikler anında hesabınıza tanımlanır.</p>
              
              <div className="space-y-4">
                
                {/* Feature 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">Tamamen Reklamsız Deneyim</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                      Sponsorlu reklamlar, görsel yükleme öncesi veya sonrasındaki bekletici popup pencereleri ve arayüz içi reklam bantları sizin için tamamen kapatılır.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">Aynı Anda 25 Fotoğraf Yükleme</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                      Aynı anda, tek tıkla yükleme sınırınız tam 25 adete çıkarılır. Toplu resim yüklerken bekleme sırası veya yükleme kotası uygulanmaz.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">7/24 VIP Canlı Destek</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                      Teknik destek talepleriniz doğrudan öncelikli VIP sırasına alınır. Yaşadığınız her türlü sorunda 7/24 anında admin desteği sunulur.
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">Yüksek Limitli Saklama Ömrü</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                      Premium görselleriniz herhangi bir zaman aşımı veya silinme riski olmadan, en yüksek bant genişliğinde kalıcı olarak saklanır.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* FSS Bank Account info */}
            <AnimatePresence>
              {paymentMethod === 'bank' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl overflow-hidden"
                  id="bank-accounts-card"
                >
                  <h3 className="text-md font-extrabold text-white">Havale / EFT Banka Hesap Bilgileri</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Aşağıdaki IBAN adresine paket tutarını gönderdikten sonra sağ taraftaki formdan havale gönderen bilgisini girerek satın almayı tamamlayabilirsiniz. Premium üyeliğiniz saniyeler içinde otomatik başlayacaktır.
                  </p>

                  <div className="space-y-3.5 bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Alıcı Hesap Sahibi</span>
                      <span className="font-bold text-zinc-100 text-sm">{bankReceiver}</span>
                    </div>
                    <div className="h-px bg-zinc-900" />
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">{bankName} IBAN</span>
                      <span className="font-mono font-black text-amber-400 text-sm tracking-wider select-all">{bankIban}</span>
                    </div>
                    <div className="h-px bg-zinc-900" />
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Açıklama (Zorunlu)</span>
                      <span className="font-bold text-zinc-100">
                        {user ? `${user.username} Premium Ödemesi` : 'Kullanıcı adınızı yazınız'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Pricing and Payment Form Column (Right) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Plan selector widgets */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl" id="premium-plan-selector">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest text-center">Bir Paket Seçin</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Monthly selector */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('monthly')}
                  className={`relative rounded-2xl border p-4.5 text-left transition-all duration-300 ${
                    selectedPlan === 'monthly'
                      ? 'border-amber-500 bg-amber-500/[0.04] shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                      : 'border-zinc-900 bg-zinc-950 hover:bg-zinc-900/30'
                  }`}
                >
                  <span className="text-xs font-bold text-zinc-400 block">Aylık Paket</span>
                  <span className="text-2xl font-black text-white mt-1.5 block">{monthlyPrice} TL</span>
                  <span className="text-[10px] text-zinc-500 block mt-1">Her ay yenilenir</span>
                  
                  {selectedPlan === 'monthly' && (
                    <span className="absolute top-3 right-3 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center text-zinc-950">
                      <Check className="h-2.5 w-2.5 stroke-[3px]" />
                    </span>
                  )}
                </button>

                {/* Yearly selector */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('yearly')}
                  className={`relative rounded-2xl border p-4.5 text-left transition-all duration-300 ${
                    selectedPlan === 'yearly'
                      ? 'border-amber-500 bg-amber-500/[0.04] shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                      : 'border-zinc-900 bg-zinc-950 hover:bg-zinc-900/30'
                  }`}
                >
                  {discountPercent > 0 && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-[9px] font-black uppercase text-zinc-950 shadow-md">
                      %{discountPercent} İndirim
                    </span>
                  )}
                  <span className="text-xs font-bold text-zinc-400 block">Yıllık Paket</span>
                  <span className="text-2xl font-black text-white mt-1.5 block">{yearlyPrice} TL</span>
                  <span className="text-[10px] text-zinc-500 block mt-1">Yıllık tek çekim</span>

                  {selectedPlan === 'yearly' && (
                    <span className="absolute top-3 right-3 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center text-zinc-950">
                      <Check className="h-2.5 w-2.5 stroke-[3px]" />
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Payment method selection & form details */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 space-y-6 shadow-xl" id="premium-payment-form">
              <div className="space-y-2 text-center border-b border-zinc-900 pb-4">
                <h3 className="text-md font-bold text-white">Güvenli Ödeme Noktası</h3>
                <p className="text-xs text-zinc-500">256-bit SSL şifreleme ve 3D Secure güvencesiyle.</p>
              </div>

              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-2 bg-zinc-900/40 p-1 rounded-xl border border-zinc-900">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Kredi Kartı</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                    paymentMethod === 'bank'
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Havale / EFT</span>
                </button>
              </div>

              {!user ? (
                <div className="text-center py-6 space-y-4">
                  <div className="h-10 w-10 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-300">Giriş Yapmanız Gerekli</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
                      Premium paket satın alabilmek ve ayrıcalıkları hesabınıza tanımlayabilmek için öncelikle üye girişi yapmalısınız.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      to="/giris"
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-xs font-bold text-teal-400"
                    >
                      Giriş Yap veya Kayıt Ol
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePurchase} className="space-y-4">
                  
                  {error && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 animate-shake">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  {paymentMethod === 'card' ? (
                    <div className="space-y-3.5">
                      {/* Cardholder name */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Kart Sahibi Adı Soyadı</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="GÖRKEM ÇETİN"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors uppercase"
                        />
                      </div>

                      {/* Card Number */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Kart Numarası</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            // Simple auto-formatting for card number blocks
                            const raw = e.target.value.replace(/\D/g, '');
                            const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                            setCardNumber(formatted);
                          }}
                          placeholder="4355 1200 4580 9110"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors font-mono tracking-widest"
                        />
                      </div>

                      {/* Expiry and CVV */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Skt (AA/YY)</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              const formatted = raw.length >= 2 ? `${raw.slice(0, 2)}/${raw.slice(2, 4)}` : raw;
                              setCardExpiry(formatted);
                            }}
                            placeholder="12/28"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors font-mono text-center"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">CVC / CVV2</label>
                          <input
                            type="password"
                            required
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            placeholder="***"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors font-mono text-center tracking-widest"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {/* Sender details */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Gönderen Adı Soyadı</label>
                        <input
                          type="text"
                          required
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="Havale Gönderen Hesap Sahibi"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                      <div className="rounded-xl bg-zinc-900/60 border border-zinc-900 p-3.5 text-xs text-zinc-500 leading-relaxed flex gap-2">
                        <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-500/80 mt-0.5" />
                        <p>
                          Sol tarafta belirtilen {bankName} IBAN hesabına, seçtiğiniz paketin tutarı olan <strong className="text-zinc-300">{selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice} TL</strong> havale/EFT yaptıktan sonra bu bildirim formunu onaylayın.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submission triggers */}
                  <div className="pt-4 space-y-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 text-xs font-black shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-1.5">
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                          <span>Ödeme İşleniyor...</span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1.5 justify-center">
                          <ShieldCheck className="h-4 w-4" />
                          <span>{selectedPlan === 'monthly' ? `${monthlyPrice} TL` : `${yearlyPrice} TL`} Öde ve Tamamla</span>
                        </span>
                      )}
                    </button>

                    <p className="text-[10px] text-zinc-500 leading-normal text-center max-w-xs mx-auto">
                      Ödemeniz tamamlandıktan sonra saniyeler içinde Premium statünüz aktif hale gelecektir. Herhangi bir sorunda <Link to="/destek" className="text-amber-500 hover:underline">destek ekibimizle</Link> iletişime geçebilirsiniz.
                    </p>
                  </div>

                </form>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
