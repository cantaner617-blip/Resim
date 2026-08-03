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
  MessageSquare,
  Sparkles,
  User as UserIcon,
  ChevronDown
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name ? name.slice(0, 2).toUpperCase() : 'U';
  };

  return (
    <header 
      id="site-header" 
      className={`sticky top-0 w-full border-b transition-all duration-500 ${
        themeShade === 'slate' 
          ? 'border-slate-800/80 bg-slate-950/75' 
          : 'border-zinc-900 bg-zinc-950/75'
      } backdrop-blur-xl z-50`}
    >
      {/* Signature Top Accent Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-500" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <Link 
          to="/"
          className="flex items-center space-x-3 group"
          id="nav-logo"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/5 text-teal-400 border border-teal-500/20 group-hover:border-teal-400/40 group-hover:from-teal-500/20 group-hover:to-emerald-500/10 transition-all duration-300 shadow-sm shadow-teal-500/5">
            {/* Pulsing Core */}
            <div className="absolute inset-0 rounded-xl bg-teal-400/10 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300" />
            <Image className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-white leading-none group-hover:text-teal-300 transition-colors duration-300">
              Anında<span className="text-teal-400">Resim</span>
            </span>
            <span className="text-[9px] text-zinc-500 font-medium tracking-widest uppercase mt-0.5 group-hover:text-zinc-400 transition-colors duration-300">
              Hızlı &amp; Güvenli
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center space-x-1 sm:space-x-3" id="nav-actions">
          
          {/* System Status Indicator (Cloudinary vs Local) */}
          {systemStatus && (
            <div 
              className="hidden md:flex items-center space-x-2 rounded-full px-3 py-1.5 text-xs font-semibold border bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200 cursor-help" 
              title={systemStatus.isCloudinaryConfigured ? "Görselleriniz güvenli bir şekilde Cloudinary bulutunda saklanıyor." : "Cloudinary anahtarı girilmedi. Görselleriniz yerel veritabanında saklanıyor."}
            >
              {systemStatus.isCloudinaryConfigured ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
                  </span>
                  <Cloud className="h-3.5 w-3.5 text-teal-400" />
                  <span className="text-zinc-400 text-[11px]">Bulut Aktif</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <Database className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-zinc-400 text-[11px]">Yerel Depolama</span>
                </>
              )}
            </div>
          )}

          {/* Home Link */}
          <NavLink
            to="/"
            id="nav-home-btn"
            className={({ isActive }) => 
              `flex items-center space-x-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-300 cursor-pointer ${
                isActive 
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm shadow-teal-500/5' 
                  : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-white border border-transparent'
              }`
            }
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Resim Yükle</span>
          </NavLink>

          {/* User Gallery Link (Only if logged in) */}
          {user && (
            <NavLink
              to="/galerim"
              id="nav-gallery-btn"
              className={({ isActive }) => 
                `flex items-center space-x-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm shadow-teal-500/5' 
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-white border border-transparent'
                }`
              }
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">Galerim</span>
            </NavLink>
          )}

          {/* Admin Panel Link (Only if admin) */}
          {user?.isAdmin && (
            <NavLink
              to="/admin"
              id="nav-admin-btn"
              className={({ isActive }) => 
                `flex items-center space-x-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'bg-rose-500/10 border border-rose-500/35 text-rose-400 shadow-sm shadow-rose-500/5' 
                    : 'text-rose-500 hover:bg-rose-500/5 hover:text-rose-400 border border-transparent'
                }`
              }
            >
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">Yönetim</span>
            </NavLink>
          )}

          {/* Elegant 3-dots Menu Dropdown for Hakkımızda, Kullanım Şartları, Yardım */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-all duration-200 border cursor-pointer ${
                dropdownOpen ? 'bg-zinc-900 text-white border-zinc-800' : 'border-transparent'
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
                className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800/90 bg-zinc-950 p-1.5 shadow-2xl ring-1 ring-black/50 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900/60 mb-1">
                  Kurumsal
                </div>
                
                <Link
                  to="/hakkimizda"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <Info className="h-3.5 w-3.5 text-teal-400" />
                  <span>Hakkımızda &amp; Altyapı</span>
                </Link>

                <Link
                  to="/sartlar"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-teal-400" />
                  <span>Kullanım Koşulları</span>
                </Link>

                <Link
                  to="/yardim"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-teal-400" />
                  <span>SSS &amp; Kılavuz</span>
                </Link>

                <div className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-t border-b border-zinc-900/60 my-1">
                  Destek &amp; Bildirim
                </div>

                <Link
                  to="/ihbar"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                  <span>İhlal Bildirimi (DMCA)</span>
                </Link>

                <Link
                  to="/destek"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                  <span>7/24 Teknik Destek</span>
                </Link>
              </div>
            )}
          </div>

          {/* Profile Actions */}
          {user ? (
            <div className="flex items-center space-x-2 border-l border-zinc-800/80 pl-2 sm:pl-3 relative" ref={profileDropdownRef}>
              
              {/* Premium Avatar and Dropdown trigger */}
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 rounded-lg p-1 hover:bg-zinc-900/80 transition-all duration-200 cursor-pointer border border-transparent hover:border-zinc-800"
              >
                {/* Visual Avatar circle */}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-500 text-zinc-950 text-xs font-black shadow-md shadow-teal-500/10">
                  {getInitials(user.username)}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs text-zinc-500 font-medium leading-none mb-0.5">Oturum Açık</span>
                  <span className="text-xs font-bold text-zinc-200 leading-none">{user.username}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
              </button>

              {profileDropdownOpen && (
                <div 
                  className="absolute right-0 top-11 mt-1.5 w-48 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl ring-1 ring-black/50 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-2.5 py-2 border-b border-zinc-900 mb-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Kullanıcı Hesabı</p>
                    <p className="text-xs font-bold text-teal-400 truncate">{user.username}</p>
                  </div>

                  <Link
                    to="/galerim?tab=profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-teal-400" />
                    <span>Profil ve Ayarlar</span>
                  </Link>

                  <Link
                    to="/galerim"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                  >
                    <Grid className="h-3.5 w-3.5 text-teal-400" />
                    <span>Görsellerim</span>
                  </Link>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                      navigate('/');
                    }}
                    id="nav-logout-btn"
                    className="flex w-full items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              )}

              {/* Direct, high-visibility logout button */}
              <button
                onClick={() => {
                  onLogout();
                  navigate('/');
                }}
                id="nav-logout-direct-btn"
                className="flex items-center space-x-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-all duration-200 cursor-pointer shadow-sm shadow-red-500/5 hover:scale-[1.02] active:scale-[0.98]"
                title="Oturumu Kapat"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Çıkış</span>
              </button>

            </div>
          ) : (
            <div className="flex items-center space-x-1 sm:space-x-2 border-l border-zinc-800/80 pl-2 sm:pl-3">
              <Link
                to="/giris"
                id="nav-login-btn"
                className="flex items-center space-x-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 hover:border-zinc-700/80 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5 text-teal-400" />
                <span className="hidden sm:inline">Giriş</span>
              </Link>
              
              <Link
                to="/kayit"
                id="nav-register-btn"
                className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-zinc-950 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-teal-500/5 hover:shadow-teal-500/10"
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
