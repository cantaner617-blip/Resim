import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Uploader from './components/Uploader';
import Gallery from './components/Gallery';
import AuthForms from './components/AuthForms';
import ImageDetail from './components/ImageDetail';
import AdminPanel from './components/AdminPanel';
import About from './components/About';
import Terms from './components/Terms';
import Help from './components/Help';
import ReportAbuse from './components/ReportAbuse';
import Support from './components/Support';
import Premium from './components/Premium';
import { User, SystemStatus } from './types';
import { ShieldCheck, Zap, Globe, Heart, AlertTriangle, Hammer, LogIn, Megaphone, X, Sparkles, Gauge, Cloud, Code, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
  const [themeShade, setThemeShade] = useState<'midnight' | 'slate'>(() => {
    return (localStorage.getItem('theme-shade') as 'midnight' | 'slate') || 'midnight';
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Sync body background color with themeShade
  useEffect(() => {
    document.body.style.backgroundColor = themeShade === 'midnight' ? '#030712' : '#0f172a';
  }, [themeShade]);

  const handleThemeShadeChange = (shade: 'midnight' | 'slate') => {
    setThemeShade(shade);
    localStorage.setItem('theme-shade', shade);
  };

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

  // Poll for system status to get real-time announcements/maintenance/status updates without F5
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSystemStatus();
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Automatically show new announcements if the list changes
  useEffect(() => {
    // New announcements with distinct IDs will automatically be shown as they won't be in dismissedAnnouncements
  }, [systemStatus?.announcements]);

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

  const announcementsToRender = systemStatus?.announcements && systemStatus.announcements.length > 0
    ? systemStatus.announcements
    : (systemStatus?.announcement ? [{
        id: 'legacy-announcement',
        message: systemStatus.announcement,
        template: (systemStatus.announcementTemplate || 'info') as 'info' | 'warning' | 'success',
        createdAt: new Date().toISOString()
      }] : []);

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

          {announcementsToRender.length > 0 && (
            <div className="space-y-2 text-left max-h-48 overflow-y-auto w-full">
              <span className="text-zinc-500 block uppercase font-bold tracking-wider text-[10px] text-center">Yönetici Duyuruları</span>
              {announcementsToRender.map((ann) => (
                <div key={ann.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-400">
                  <p className="leading-relaxed whitespace-pre-line font-medium">{ann.message}</p>
                </div>
              ))}
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
    <div className={`min-h-screen ${themeShade === 'midnight' ? 'bg-[#030712]' : 'bg-[#0f172a]'} text-zinc-200 selection:bg-teal-500 selection:text-zinc-950 flex flex-col justify-between transition-colors duration-300`}>
      
      {/* Navbar wrapper */}
      <Navbar 
        user={user} 
        onLogout={handleLogout}
        systemStatus={systemStatus}
        themeShade={themeShade}
      />

      {/* 📣 Premium Floating Announcement System Alert Banner (Positioned beautifully below the Navbar with custom padding & alignment) */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 space-y-3">
        <AnimatePresence>
          {announcementsToRender
            .filter(ann => !dismissedAnnouncements.includes(ann.id))
            .map((ann) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: -12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.99 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl bg-zinc-950/15 p-4 sm:p-5 shadow-xl transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-2xl ${
                  ann.template === 'success'
                    ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-300 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.2)] shadow-emerald-900/10 hover:bg-emerald-500/[0.12] hover:border-emerald-500/35 hover:shadow-emerald-950/30'
                    : ann.template === 'warning'
                      ? 'bg-amber-500/[0.06] border-amber-500/20 text-amber-300 shadow-[inset_0_1px_0_0_rgba(245,158,11,0.2)] shadow-amber-900/10 hover:bg-amber-500/[0.12] hover:border-amber-500/35 hover:shadow-amber-950/30'
                      : 'bg-teal-500/[0.06] border-teal-500/20 text-teal-300 shadow-[inset_0_1px_0_0_rgba(20,184,166,0.2)] shadow-teal-900/10 hover:bg-teal-500/[0.12] hover:border-teal-500/35 hover:shadow-teal-950/30'
                }`}
              >
                {/* Background accent ambient light */}
                <div className={`absolute top-0 left-0 w-32 h-full filter blur-xl opacity-10 pointer-events-none ${
                  ann.template === 'success' ? 'bg-emerald-400' : ann.template === 'warning' ? 'bg-amber-400' : 'bg-teal-400'
                }`} />

                <div className="flex items-start gap-4 relative z-10">
                  {/* Announcement Icon Box */}
                  <div className={`shrink-0 flex items-center justify-center h-10 w-10 rounded-xl border shadow-md transition-all duration-300 ${
                    ann.template === 'success'
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : ann.template === 'warning'
                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                        : 'bg-teal-500/20 border-teal-500/30 text-teal-400'
                  }`}>
                    {ann.template === 'success' ? (
                      <Sparkles className="h-5 w-5 animate-pulse text-emerald-400" />
                    ) : ann.template === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 animate-bounce text-amber-400" style={{ animationDuration: '3s' }} />
                    ) : (
                      <Megaphone className="h-5 w-5 text-teal-400" />
                    )}
                  </div>

                  {/* Announcement Content Area */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                        ann.template === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/10'
                          : ann.template === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/10'
                            : 'bg-teal-500/20 text-teal-300 border border-teal-500/10'
                      }`}>
                        {ann.template === 'success' ? 'Güncelleme' : ann.template === 'warning' ? 'Kritik Uyarı' : 'İpucu'}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Sistem Bildirimi</span>
                    </div>
                    
                    {/* Text without hard truncation so the announcement is fully visible! */}
                    <p className="text-[13px] sm:text-sm font-medium text-zinc-100 leading-relaxed whitespace-pre-line break-words select-text">
                      {ann.message}
                    </p>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setDismissedAnnouncements(prev => [...prev, ann.id])}
                    className="flex items-center justify-center rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer shrink-0"
                    aria-label="Kapat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Main Page Area managed by React Router */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8 lg:px-8">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            
            {/* Home Route (Uploader) */}
            <Route path="/" element={
              <div className="space-y-12">
                
                {/* Visual Header Banner */}
                <div className="text-center space-y-6 max-w-2xl mx-auto pt-4 pb-2 animate-fade-in" id="home-landing-banner">
                  <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-none">
                    Sınırsız ve Hızlı <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300">
                      Görsel Paylaşım
                    </span>
                  </h1>
                  
                  <p className="text-base sm:text-lg text-zinc-400 font-medium max-w-xl mx-auto leading-relaxed">
                    Üye olmadan veya ücretsiz üye olarak görsellerinizi anında internete yükleyin. Doğrudan linkler ve forum kodları saniyeler içinde elinizde olsun.
                  </p>

                  {/* Top Premium Interactive Feature Capsules with refined hover scales and gorgeous micro-actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2" id="top-feature-badges">
                    
                    {/* Feature 1: Speed */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:w-auto flex items-center space-x-2.5 rounded-full border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl px-4.5 py-2.5 shadow-md transition-all hover:border-teal-500/35 hover:bg-zinc-900/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.12)] group cursor-default"
                      id="top-feature-speed"
                    >
                      <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-300">
                        <Gauge className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors duration-200">
                        Süper Hızlı Altyapı
                      </span>
                    </motion.div>

                    {/* Feature 2: Cloud Storage */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:w-auto flex items-center space-x-2.5 rounded-full border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl px-4.5 py-2.5 shadow-md transition-all hover:border-emerald-500/35 hover:bg-zinc-900/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] group cursor-default"
                      id="top-feature-cloud"
                    >
                      <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                        <Cloud className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors duration-200">
                        Kalıcı Bulut Depolama
                      </span>
                    </motion.div>

                    {/* Feature 3: Embed Integration */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:w-auto flex items-center space-x-2.5 rounded-full border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl px-4.5 py-2.5 shadow-md transition-all hover:border-blue-500/35 hover:bg-zinc-900/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.12)] group cursor-default"
                      id="top-feature-embed"
                    >
                      <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                        <Code className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors duration-200">
                        Küresel Embed Entegrasyonu
                      </span>
                    </motion.div>

                  </div>
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
                <Gallery 
                  user={user}
                  themeShade={themeShade}
                  onThemeShadeChange={handleThemeShadeChange}
                />
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

            {/* Static Info Routes */}
            <Route path="/hakkimizda" element={<About />} />
            <Route path="/sartlar" element={<Terms />} />
            <Route path="/yardim" element={<Help />} />
            <Route path="/ihbar" element={<ReportAbuse />} />
            <Route path="/destek" element={<Support user={user} />} />
            <Route path="/premium" element={<Premium user={user} systemStatus={systemStatus} onRefreshSession={checkSession} />} />

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </AnimatePresence>
      </main>

      {/* Elegant minimalist Footer */}
      <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-zinc-400">
            <Link to="/hakkimizda" className="hover:text-teal-400 transition-colors">Hakkımızda &amp; Platform Mimarisi</Link>
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
            <Link to="/sartlar" className="hover:text-teal-400 transition-colors">Kullanım Şartları ve Hizmet Standartları</Link>
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
            <Link to="/yardim" className="hover:text-teal-400 transition-colors">Yardım &amp; SSS</Link>
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
            <Link to="/ihbar" className="hover:text-red-400 transition-colors text-red-400/90">Kötüye Kullanım Bildir (DMCA / İhlal)</Link>
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
            <Link to="/destek" className="hover:text-teal-400 transition-colors">İletişim &amp; Destek Merkezi</Link>
          </div>
          <div className="border-t border-zinc-900/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div className="flex items-center space-x-1">
              <span>&copy; {new Date().getFullYear()}</span>
              <span className="font-bold text-zinc-400">AnındaResim</span>
              <span>- Tüm Hakları Saklıdır.</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span>Türkiye'nin hızlı resim paylaşım platformu ile</span>
              <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
            </div>
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
