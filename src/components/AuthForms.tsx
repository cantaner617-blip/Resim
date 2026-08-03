import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, LogIn, UserPlus, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface AuthFormsProps {
  type: 'login' | 'register';
  onAuthSuccess: (user: User, token: string) => void;
}

export default function AuthForms({ type, onAuthSuccess }: AuthFormsProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>(type);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (mode === 'login' || mode === 'register') {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login' 
        ? { email, password } 
        : { username, email, password };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Giriş işlemi gerçekleştirilirken bir hata oluştu.");
        }

        onAuthSuccess(data.user, data.token);
        navigate('/');
      } catch (err: any) {
        console.error(err);
        setError(err.message || "İşlem sırasında beklenmedik bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    } else if (mode === 'forgot-password') {
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Şifre sıfırlama kodu gönderilirken bir hata oluştu.");
        }

        setSuccessMessage(data.message || "Doğrulama kodu e-postanıza gönderildi!");
        setMode('reset-password');
      } catch (err: any) {
        console.error(err);
        setError(err.message || "İşlem sırasında beklenmedik bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    } else if (mode === 'reset-password') {
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Şifre sıfırlanırken bir hata oluştu.");
        }

        setSuccessMessage(data.message || "Şifreniz başarıyla sıfırlandı!");
        setCode('');
        setNewPassword('');
        
        // Auto-redirect to login
        setTimeout(() => {
          setMode('login');
          setSuccessMessage(null);
        }, 2500);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "İşlem sırasında beklenmedik bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-md w-full" id="auth-forms-container">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 sm:p-8 space-y-6 shadow-xl"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'login' && 'Hesabına Giriş Yap'}
            {mode === 'register' && 'Yeni Hesap Oluştur'}
            {mode === 'forgot-password' && 'Şifremi Unuttum'}
            {mode === 'reset-password' && 'Yeni Şifre Belirle'}
          </h2>
          <p className="text-sm text-zinc-400">
            {mode === 'login' && 'Yüklediğin resimleri kalıcı saklamak ve istediğinde silmek için giriş yap.'}
            {mode === 'register' && 'Ücretsiz bir hesap oluşturarak kendi resim galerini yönetmeye başla.'}
            {mode === 'forgot-password' && 'Kayıtlı e-posta adresini girerek 6 haneli şifre sıfırlama kodu iste.'}
            {mode === 'reset-password' && 'E-posta adresine gelen 6 haneli kod ile yeni şifreni güvenle tanımla.'}
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 rounded-xl border border-red-950 bg-red-950/20 p-4 text-sm text-red-400 animate-pulse" id="auth-error-alert">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center space-x-2 rounded-xl border border-teal-950 bg-teal-950/20 p-4 text-sm text-teal-400" id="auth-success-alert">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" id="auth-form-el">
          
          {/* USERNAME INPUT (Only for Register) */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-teal-400" />
                Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Örn: iremsaltanat"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          )}

          {/* EMAIL INPUT (For Login, Register, Forgot Password, Reset Password) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-teal-400" />
              E-posta Adresi
            </label>
            <input
              type="email"
              required
              disabled={mode === 'reset-password'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="isim@adres.com"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* VERIFICATION CODE INPUT (Only for Reset Password) */}
          {mode === 'reset-password' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-teal-400" />
                Doğrulama Kodu (6 Haneli)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                pattern="\d{6}"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] font-mono rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-lg text-teal-400 placeholder-zinc-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          )}

          {/* PASSWORD INPUT (Only for Login, Register) */}
          {(mode === 'login' || mode === 'register') && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-teal-400" />
                  Şifre
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setMode('forgot-password');
                    }}
                    className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                  >
                    Şifremi Unuttum?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          )}

          {/* NEW PASSWORD INPUT (Only for Reset Password) */}
          {mode === 'reset-password' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-teal-400" />
                Yeni Şifre
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-teal-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all duration-200 mt-6 cursor-pointer font-bold"
            id="auth-submit-btn"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent"></div>
            ) : (
              <>
                {mode === 'login' && (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Giriş Yap</span>
                  </>
                )}
                {mode === 'register' && (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Hesabımı Oluştur</span>
                  </>
                )}
                {mode === 'forgot-password' && (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Kod Gönder</span>
                  </>
                )}
                {mode === 'reset-password' && (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Şifremi Sıfırla</span>
                  </>
                )}
              </>
            )}
          </button>
        </form>

        {/* BOTTOM TOGGLE LINKS */}
        <div className="border-t border-zinc-900 pt-5 text-center text-sm text-zinc-500">
          {mode === 'login' && (
            <p>
              Hesabın yok mu?{' '}
              <Link
                to="/kayit"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode('register');
                }}
                className="text-teal-400 hover:text-teal-300 font-medium hover:underline"
              >
                Kayıt Ol
              </Link>
            </p>
          )}
          {mode === 'register' && (
            <p>
              Zaten kayıtlı mısın?{' '}
              <Link
                to="/giris"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="text-teal-400 hover:text-teal-300 font-medium hover:underline"
              >
                Giriş Yap
              </Link>
            </p>
          )}
          {(mode === 'forgot-password' || mode === 'reset-password') && (
            <div className="flex flex-col gap-2">
              {mode === 'reset-password' && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('forgot-password');
                  }}
                  className="text-teal-400 hover:text-teal-300 font-semibold text-xs cursor-pointer"
                >
                  Yeniden Doğrulama Kodu İste
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="text-zinc-400 hover:text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Giriş Ekranına Dön
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
