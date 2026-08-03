import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Image, 
  LogIn, 
  LogOut, 
  UserPlus, 
  Grid, 
  Cloud, 
  Database, 
  ShieldAlert, 
  MoreVertical, 
  Info, 
  FileText, 
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { User, SystemStatus } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  systemStatus: SystemStatus | null;
  themeShade?: 'midnight' | 'slate';
}

export default function Navbar({ user, onLogout, systemStatus, themeShade }: NavbarProps) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header 
      id="site-header" 
      className={`sticky top-0 z-50 w-full border-b transition-colors duration-300 ${
        themeShade === 'slate' 
          ? 'border-slate-800 bg-[#0f172a]/80' 
          : 'border-zinc-900 bg-[#030712]/80'
      } backdrop-blur-md`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <Link 
          to="/"
          className="flex items-center space-x-2 group"
          id="nav-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:bg-teal-500/20 transition-all duration-300">
            <Image className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-teal-400 transition-colors duration-300">
            Anında<span className="text-teal-400">Resim</span>
          </span>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center space-x-2 sm:space-x-4" id="nav-actions">
          
          {/* System Status Indicator (Cloudinary vs Local) */}
          {systemStatus && (
            <div className="hidden md:flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-medium border bg-zinc-900 border-zinc-800" title={systemStatus.isCloudinaryConfigured ? "Görselleriniz güvenli bir şekilde Cloudinary bulutunda saklanıyor." : "Cloudinary anahtarı girilmedi. Görselleriniz yerel veritabanında saklanıyor."}>
              {systemStatus.isCloudinaryConfigured ? (
                <>
                  <Cloud className="h-3.5 w-3.5 text-teal-400" />
                  <span className="text-zinc-400">Bulut Depolama</span>
                </>
              ) : (
                <>
                  <Database className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-zinc-400">Yerel Fallback Aktif</span>
                </>
              )}
            </div>
          )}

          {/* Home Link */}
          <NavLink
            to="/"
            id="nav-home-btn"
            className={({ isActive }) => 
              `flex items-center space-x-1.5 rounded-lg px-2 sm:px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-zinc-850 text-white font-semibold border border-zinc-750' 
                  : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white border border-transparent'
              }`
            }
          >
            <Image className="h-4 w-4 text-teal-400" />
            <span className="hidden sm:inline">Resim Yükle</span>
          </NavLink>

          {/* User Gallery Link (Only if logged in) */}
          {user && (
            <NavLink
              to="/galerim"
              id="nav-gallery-btn"
              className={({ isActive }) => 
                `flex items-center space-x-1.5 rounded-lg px-2 sm:px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-zinc-850 text-white font-semibold border border-zinc-750' 
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white border border-transparent'
                }`
              }
            >
              <Grid className="h-4 w-4 text-teal-400" />
              <span className="hidden sm:inline">Galerim</span>
            </NavLink>
          )}

          {/* Admin Panel Link (Only if admin) */}
          {user?.isAdmin && (
            <NavLink
              to="/admin"
              id="nav-admin-btn"
              className={({ isActive }) => 
                `flex items-center space-x-1.5 rounded-lg px-2 sm:px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-teal-950/40 border border-teal-500/30 text-teal-300 font-semibold' 
                    : 'text-teal-500 hover:bg-teal-950/10 hover:text-teal-300 border border-transparent'
                }`
              }
            >
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">Admin Paneli</span>
            </NavLink>
          )}

          {/* Elegant 3-dots Menu Dropdown for Hakkımızda, Kullanım Şartları, Yardım */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center justify-center rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-all duration-200 border cursor-pointer ${
                dropdownOpen ? 'bg-zinc-900 text-white border-zinc-750' : 'border-transparent'
              }`}
              title="Bilgi ve Yardım"
              aria-label="Daha fazla seçenek"
              id="nav-more-dropdown-trigger"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {dropdownOpen && (
              <div 
                id="nav-more-dropdown-menu"
                className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl ring-1 ring-black/50 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-900/60 mb-1">
                  Platform Bilgileri
                </div>
                
                <Link
                  to="/hakkimizda"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <Info className="h-3.5 w-3.5 text-teal-400" />
                  <span>Hakkımızda &amp; Mimari</span>
                </Link>

                <Link
                  to="/sartlar"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-teal-400" />
                  <span>Kullanım Şartları</span>
                </Link>

                <Link
                  to="/yardim"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-teal-400" />
                  <span>Yardım &amp; SSS</span>
                </Link>

                <div className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-t border-b border-zinc-900/60 my-1">
                  Yasal &amp; İletişim
                </div>

                <Link
                  to="/ihbar"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-red-400/90 hover:text-red-400">Kötüye Kullanım Bildir</span>
                </Link>

                <Link
                  to="/destek"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                  <span>7/24 Destek &amp; İletişim</span>
                </Link>
              </div>
            )}
          </div>

          {/* Profile Actions */}
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3 border-l border-zinc-800/80 pl-2 sm:pl-4">
              <Link 
                to="/galerim?tab=profile"
                className="hidden lg:inline-flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-teal-400 transition-colors duration-200 group/greeting"
                title="Profil Ayarları & Tema Seçimi"
              >
                <span>Merhaba,</span>
                <strong className="text-white font-extrabold px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800/60 group-hover/greeting:bg-zinc-850 group-hover/greeting:border-teal-500/30 transition-all">{user.username}</strong>
              </Link>
              <button
                onClick={() => {
                  onLogout();
                  navigate('/');
                }}
                id="nav-logout-btn"
                className="flex items-center space-x-1.5 rounded-lg border border-red-950 bg-red-950/10 hover:bg-red-950/30 px-3 py-2 text-xs sm:text-sm font-semibold text-red-400 hover:text-red-300 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Çıkış Yap"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Çıkış Yap</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1 sm:space-x-2.5 border-l border-zinc-800/80 pl-2 sm:pl-4">
              <Link
                to="/giris"
                id="nav-login-btn"
                className="flex items-center space-x-1.5 rounded-lg border border-zinc-850 bg-zinc-900/40 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 hover:border-zinc-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn className="h-3.5 w-3.5 text-teal-400" />
                <span className="hidden sm:inline">Giriş Yap</span>
              </Link>
              
              <Link
                to="/kayit"
                id="nav-register-btn"
                className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-zinc-950 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-teal-950/20"
              >
                <UserPlus className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Kayıt Ol</span>
              </Link>
            </div>
          )}

        </nav>
      </div>
    </header>
  );
}
