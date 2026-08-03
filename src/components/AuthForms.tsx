import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface AuthFormsProps {
  type: 'login' | 'register';
  onAuthSuccess: (user: User, token: string) => void;
}

export default function AuthForms({ type, onAuthSuccess }: AuthFormsProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = type === 'login' 
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
            {type === 'login' ? 'Hesabına Giriş Yap' : 'Yeni Hesap Oluştur'}
          </h2>
          <p className="text-sm text-zinc-400">
            {type === 'login' 
              ? 'Yüklediğin resimleri kalıcı saklamak ve istediğinde silmek için giriş yap.' 
              : 'Ücretsiz bir hesap oluşturarak kendi resim galerini yönetmeye başla.'}
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 rounded-xl border border-red-950 bg-red-950/20 p-4 text-sm text-red-400" id="auth-error-alert">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" id="auth-form-el">
          {type === 'register' && (
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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-teal-400" />
              E-posta Adresi
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="isim@adres.com"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-teal-400" />
              Şifre
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-teal-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all duration-200 mt-6 cursor-pointer"
            id="auth-submit-btn"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent"></div>
            ) : type === 'login' ? (
              <>
                <LogIn className="h-4 w-4" />
                <span>Giriş Yap</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Hesabımı Oluştur</span>
              </>
            )}
          </button>
        </form>

        <div className="border-t border-zinc-900 pt-5 text-center text-sm text-zinc-500">
          {type === 'login' ? (
            <p>
              Hesabın yok mu?{' '}
              <Link
                to="/kayit"
                className="text-teal-400 hover:text-teal-300 font-medium hover:underline"
              >
                Kayıt Ol
              </Link>
            </p>
          ) : (
            <p>
              Zaten kayıtlı mısın?{' '}
              <Link
                to="/giris"
                className="text-teal-400 hover:text-teal-300 font-medium hover:underline"
              >
                Giriş Yap
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
