import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, CheckCircle, AlertCircle, Sparkles, Mail, ShieldCheck, Heart, User as UserIcon, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { User, SupportMessage } from '../types';

interface SupportProps {
  user: User | null;
}

export default function Support({ user }: SupportProps) {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [myMessages, setMyMessages] = useState<SupportMessage[]>([]);

  // Auto-fill user information if logged in
  useEffect(() => {
    if (user) {
      setName(user.username);
      setEmail(user.email);
    }
  }, [user]);

  // Fetch previous messages & replies
  const fetchMyMessages = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/support-messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching support messages:', err);
    }
  };

  useEffect(() => {
    fetchMyMessages();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/support-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Mesaj gönderilirken bir hata oluştu.');
      }

      setSuccess(true);
      // Reset form fields
      setMessage('');
      setSubject('');
      fetchMyMessages();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Teknik bir sorun oluştu, lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12" id="support-container">
      <div className="text-center space-y-3 mb-12">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-inner">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">7/24 İletişim &amp; Destek Merkezi</h1>
        <p className="text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed">
          Bir sorunuz mu var veya yardıma mı ihtiyacınız var? Bizimle her an doğrudan iletişime geçebilirsiniz. Destek ekibimiz en kısa sürede geri dönüş yapacaktır.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Info Cards Side */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl border border-zinc-850 bg-zinc-950/20 p-5 space-y-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-400/10 text-teal-400">
              <Mail className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white text-sm">Doğrudan E-Posta</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Her türlü teknik sorun, kurumsal iş birliği veya genel sorularınız için bize yazabilirsiniz:
            </p>
            <a href="mailto:support@anindaresim.com" className="text-xs font-bold text-teal-400 hover:underline block pt-1">
              support@anindaresim.com
            </a>
          </div>

          <div className="rounded-2xl border border-zinc-850 bg-zinc-950/20 p-5 space-y-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-400/10 text-teal-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white text-sm">Hızlı Yanıt Süresi</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              İletilen tüm mesajlar destek ekiplerimizce incelenerek ortalama <strong>1 ile 4 saat</strong> içerisinde kayıtlı e-posta adresinize cevap olarak iletilmektedir.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-850 bg-zinc-950/20 p-5 space-y-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-400/10 text-teal-400">
              <Heart className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white text-sm">%100 Memnuniyet</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Kullanıcılarımızın deneyimi bizim en büyük önceliğimizdir. AnındaResim platformu olarak her adımda yanınızdayız!
            </p>
          </div>
        </div>

        {/* Form panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="md:col-span-2 rounded-2xl border border-zinc-850 bg-zinc-950/40 p-6 sm:p-8 shadow-xl backdrop-blur-sm"
        >
          {success ? (
            <div className="text-center py-10 space-y-4" id="support-success-state">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Mesajınız Gönderildi!</h2>
                <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                  Bizimle iletişime geçtiğiniz için teşekkür ederiz. Destek ekibimiz mesajınızı inceleyip en kısa sürede sizinle bağlantı kuracaktır.
                </p>
              </div>
              <div className="pt-4 flex justify-center gap-4">
                <button
                  onClick={() => setSuccess(false)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Yeni Mesaj Gönder
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
            <form onSubmit={handleSubmit} className="space-y-5" id="support-contact-form">
              <h2 className="text-lg font-bold text-white mb-2">Destek Formu</h2>
              
              {error && (
                <div className="flex items-center space-x-2 rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400" id="support-error-alert">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider" htmlFor="support-name">Adınız Soyadınız *</label>
                  <input
                    id="support-name"
                    type="text"
                    required
                    placeholder="Deniz Yıldız"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider" htmlFor="support-email">E-Posta Adresiniz *</label>
                  <input
                    id="support-email"
                    type="email"
                    required
                    placeholder="deniz@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider" htmlFor="support-subject">Konu *</label>
                <input
                  id="support-subject"
                  type="text"
                  required
                  placeholder="e.g. Teknik Hata, Geliştirme Önerisi, Hesap Sorunları"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider" htmlFor="support-message">Mesajınız *</label>
                <textarea
                  id="support-message"
                  required
                  rows={6}
                  placeholder="Yaşadığınız sorunu, geliştirmek istediğiniz özellikleri veya sormak istediğiniz soruları buraya detaylı bir şekilde yazınız..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-y"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                id="support-submit-btn"
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-teal-400 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Mesajınız İletiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Mesajı Gönder</span>
                  </>
                )}
              </button>

            </form>
          )}
        </motion.div>

      </div>

      {/* My Tickets Section (Only if logged-in and has sent at least one ticket) */}
      {user && myMessages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 rounded-3xl border border-zinc-900 bg-zinc-950/20 p-6 sm:p-8 space-y-6 shadow-xl"
          id="user-tickets-list"
        >
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-teal-400" />
              Destek Taleplerim ve Canlı Cevaplar ({myMessages.length})
            </h2>
            <p className="text-xs text-zinc-400">İlettiğiniz destek taleplerini ve yetkililer tarafından verilen canlı cevapları takip edin.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myMessages.map((msg) => (
              <div key={msg.id} className="rounded-2xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm font-bold text-white">{msg.subject}</strong>
                      {msg.status === 'unread' ? (
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-400 ring-1 ring-inset ring-blue-500/20">
                          Sıraya Alındı
                        </span>
                      ) : msg.status === 'read' ? (
                        <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] font-bold text-zinc-400">
                          İncelemede
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                          Çözüldü / Cevaplandı
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold block">{new Date(msg.createdAt).toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px] block">İlettiğiniz Mesaj:</span>
                  <p className="text-xs text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed bg-zinc-900/10 rounded-xl p-3">{msg.message}</p>
                </div>

                {msg.adminReply ? (
                  <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.02] p-4 text-xs space-y-1.5 relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/[0.02] rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex items-center justify-between text-[9px] font-black text-amber-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
                        <span>YETKİLİ DESTEK YANITI</span>
                      </span>
                      <span>{msg.repliedAt ? new Date(msg.repliedAt).toLocaleString('tr-TR') : ''}</span>
                    </div>
                    <p className="text-zinc-200 font-bold whitespace-pre-wrap leading-relaxed">{msg.adminReply}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold bg-zinc-900/20 rounded-xl p-3 border border-zinc-900">
                    <Clock className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                    <span>Destek ekibimiz bu talebi inceliyor. Canlı yanıtınız burada görünecektir!</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
}
