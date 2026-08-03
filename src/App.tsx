import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Uploader from './components/Uploader';
import Gallery from './components/Gallery';
import AuthForms from './components/AuthForms';
import ImageDetail from './components/ImageDetail';
import AdminPanel from './components/AdminPanel';
import { User, SystemStatus } from './types';
import { ShieldCheck, Zap, Globe, Heart, AlertTriangle, Hammer, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Load active session and check system status
  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/system-status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (err) {
      console.error("System status retrieval failed:", err);
    }
  };

  const checkSession = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (err) {
        console.error("Session verification failed:", err);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoadingSession(false);
  };

  useEffect(() => {
    const initApp = async () => {
      await checkSession();
      await fetchSystemStatus();
    };
    initApp();
  }, [location.pathname]); // Refresh on navigation to sync status/configs

  const handleAuthSuccess = (authenticatedUser: User, token: string) => {
    localStorage.setItem('token', token);
    setUser(authenticatedUser);
    fetchSystemStatus(); // Refresh status on login (to fetch admin config)
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
          <span className="text-sm font-medium">Yükleniyor, lütfen bekleyin...</span>
        </div>
      </div>
    );
  }

  // Maintenance Mode Intercept
  const isMaintenanceMode = systemStatus?.maintenanceMode === true;
  const isAdmin = user?.isAdmin === true;
  const showMaintenance = isMaintenanceMode && !isAdmin;

  if (showMaintenance && location.pathname !== '/giris') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center p-6 text-center select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full bg-zinc-950/40 border border-zinc-900 rounded-3xl p-8 sm:p-10 space-y-6 shadow-2xl relative"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mx-auto animate-pulse">
            <Hammer className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Sistem Bakımdadır</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Sizlere daha hızlı ve kararlı bir hizmet sunabilmek için şu anda planlı bakım çalışması gerçekleştirmekteyiz. Çok yakında tekrar aktif olacağız!
            </p>
          </div>

          {systemStatus?.announcement && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-left text-xs text-zinc-400 space-y-1">
              <span className="text-zinc-500 block uppercase font-bold tracking-wider text-[10px]">Yönetici Notu:</span>
              <p className="leading-relaxed whitespace-pre-line">{systemStatus.announcement}</p>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/giris"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Yönetici Girişi</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-teal-500 selection:text-zinc-950 flex flex-col justify-between">
      
      {/* 📣 Announcement System Alert Bar */}
      {systemStatus?.announcement && !dismissedAnnouncement && (
        <div className={`w-full border-b transition-all ${
          systemStatus.announcementTemplate === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : systemStatus.announcementTemplate === 'warning'
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              : 'bg-teal-500/10 border-teal-500/20 text-teal-300'
        }`}>
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4 text-xs font-medium">
            <div className="flex items-center space-x-2">
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-current/10">
                {systemStatus.announcementTemplate === 'success' ? 'Duyuru' : systemStatus.announcementTemplate === 'warning' ? 'Önemli' : 'Bilgi'}
              </span>
              <span className="truncate leading-relaxed">{systemStatus.announcement}</span>
            </div>
            <button
              onClick={() => setDismissedAnnouncement(true)}
              className="text-[10px] uppercase font-bold tracking-wider hover:underline shrink-0 opacity-80 hover:opacity-100"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Navbar wrapper */}
      <Navbar 
        user={user} 
        onLogout={handleLogout}
        systemStatus={systemStatus}
      />

      {/* Main Page Area managed by React Router */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            
            {/* Home Route (Uploader) */}
            <Route path="/" element={
              <div className="space-y-12">
                
                {/* Visual Header Banner */}
                <div className="text-center space-y-4 max-w-2xl mx-auto pt-4 pb-2" id="home-landing-banner">
                  <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-none">
                    Sınırsız ve Hızlı <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300">
                      Görsel Paylaşım
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg text-zinc-400 font-medium">
                    Üye olmadan veya ücretsiz üye olarak görsellerinizi anında internete yükleyin. Doğrudan linkler ve forum kodları saniyeler içinde elinizde olsun.
                  </p>
                </div>

                {/* File Uploader Target */}
                <Uploader 
                  user={user} 
                  onUploadSuccess={(id) => navigate(`/i/${id}`)}
                  systemStatus={systemStatus}
                />

                {/* Landing features grid (No identical cards, flattened spacing) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-zinc-900" id="landing-features">
                  
                  <div className="flex items-start space-x-3.5 p-4 rounded-xl hover:bg-zinc-900/10 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">Maksimum Hız</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Yüksek bant genişliği sayesinde resimleriniz milisaniyeler içerisinde yüklenir ve anında paylaşıma hazır hale gelir.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 p-4 rounded-xl hover:bg-zinc-900/10 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">Kalıcı Depolama</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Üye olarak yüklediğiniz tüm dosyalar, Cloudinary bulut yedeklemeleriyle hesabınızda sonsuza kadar güvende saklanır.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 p-4 rounded-xl hover:bg-zinc-900/10 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">Küresel Embed Desteği</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Forumlar için BBCode, bloglar için HTML ve dokümanlarınız için Markdown bağlantıları otomatik üretilir.
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            } />

            {/* Gallery Route (Requires Login) */}
            <Route path="/galerim" element={
              user ? (
                <Gallery />
              ) : (
                <Navigate to="/giris" replace />
              )
            } />

            {/* Login Route */}
            <Route path="/giris" element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <AuthForms type="login" onAuthSuccess={handleAuthSuccess} />
              )
            } />

            {/* Register Route */}
            <Route path="/kayit" element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <AuthForms type="register" onAuthSuccess={handleAuthSuccess} />
              )
            } />

            {/* Image Details Route */}
            <Route path="/i/:id" element={
              <ImageDetailWrapper />
            } />

            {/* Admin Panel Route */}
            <Route path="/admin" element={
              user?.isAdmin ? (
                <AdminPanel user={user} />
              ) : (
                <Navigate to="/" replace />
              )
            } />

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </AnimatePresence>
      </main>

      {/* Elegant minimalist Footer */}
      <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-6 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center space-x-1">
            <span>&copy; {new Date().getFullYear()}</span>
            <span className="font-bold text-zinc-400">ResimYükle</span>
            <span>- Tüm Hakları Saklıdır.</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span>Türkiye'nin hızlı resim paylaşım platformu ile</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
          </div>
        </div>
      </footer>

    </div>
  );
}

// Helper wrapper to extract params natively from route
import { useParams } from 'react-router-dom';
function ImageDetailWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/" replace />;
  return <ImageDetail id={id} onBack={() => navigate('/')} />;
}
