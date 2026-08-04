import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  ChevronDown,
  Menu,
  X,
  Shield,
  Clock,
  ExternalLink
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
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns and mobile menu on route change
  useEffect(() => {
    setDropdownOpen(false);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name ? name.slice(0, 2).toUpperCase() : 'U';
  };

  return (
    <>
      <header 
        id="site-header" 
        className={`sticky top-0 w-full border-b transition-all duration-500 ${
          themeShade === 'slate' 
            ? 'border-slate-800/60 bg-slate-950/80' 
            : 'border-zinc-900/80 bg-zinc-950/80'
        } backdrop-blur-md z-40`}
      >
        {/* Top Glow Accent Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 shadow-lg shadow-teal-500/20" />

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo and Brand */}
          <Link 
            to="/"
            className="flex items-center space-x-3 group"
            id="nav-logo"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/5 text-teal-400 border border-teal-500/20 group-hover:border-teal-400/40 group-hover:from-teal-500/20 group-hover:to-emerald-500/10 transition-all duration-300 shadow-sm">
              <div className="absolute inset-0 rounded-xl bg-teal-400/10 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300" />
              <Image className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white leading-none group-hover:text-teal-300 transition-colors duration-300">
                Anında<span className="text-teal-400">Resim</span>
              </span>
              <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5 group-hover:text-zinc-400 transition-colors duration-300">
                Hızlı &amp; Güvenli
              </span>
            </div>
          </Link>

          {/* Desktop Navigation & Actions */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-3" id="nav-actions">
            
            {/* System Status Indicator */}
            {systemStatus && (
              <div 
                className="flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200 cursor-help" 
                title={systemStatus.isCloudinaryConfigured ? "Bulut depolama aktif" : "Yerel depolama aktif"}
              >
                {systemStatus.isCloudinaryConfigured ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
                    </span>
                    <Cloud className="h-3 w-3 text-teal-400 animate-pulse" />
                    <span className="text-zinc-400 text-[11px] font-medium">Bulut</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <Database className="h-3 w-3 text-amber-500" />
                    <span className="text-zinc-400 text-[11px] font-medium">Yerel</span>
                  </>
                )}
              </div>
            )}

            {/* Nav Links */}
            <NavLink
              to="/"
              id="nav-home-btn"
              className={({ isActive }) => 
                `flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs lg:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm shadow-teal-500/5' 
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white border border-transparent'
                }`
              }
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Görsel Yükle</span>
            </NavLink>

            {user && (
              <NavLink
                to="/galerim"
                id="nav-gallery-btn"
                className={({ isActive }) => 
                  `flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs lg:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm shadow-teal-500/5' 
                      : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white border border-transparent'
                  }`
                }
              >
                <Grid className="h-3.5 w-3.5" />
                <span>Galerim</span>
              </NavLink>
            )}

            {systemStatus?.premiumEnabled && (
              <NavLink
                to="/premium"
                id="nav-premium-btn"
                className={({ isActive }) => 
                  `flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs lg:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/5' 
                      : 'text-amber-400/90 hover:bg-amber-500/5 hover:text-amber-300 border border-transparent'
                  }`
                }
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-400 fill-amber-400/20" />
                <span>Premium Satın Al</span>
              </NavLink>
            )}

            {user?.isAdmin && (
              <NavLink
                to="/admin"
                id="nav-admin-btn"
                className={({ isActive }) => 
                  `flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs lg:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-rose-500/10 border border-rose-500/35 text-rose-400 shadow-sm shadow-rose-500/5' 
                      : 'text-rose-400/80 hover:bg-rose-500/5 hover:text-rose-400 border border-transparent'
                  }`
                }
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Yönetim</span>
              </NavLink>
            )}

            {/* More Menu Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-all duration-200 border cursor-pointer ${
                  dropdownOpen ? 'bg-zinc-900 text-white border-zinc-800' : 'border-transparent'
                }`}
                title="Bilgi ve Yardım"
                aria-label="Diha fazla"
                id="nav-more-dropdown-trigger"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {dropdownOpen && (
                <div 
                  id="nav-more-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800/80 bg-zinc-950 p-1.5 shadow-2xl ring-1 ring-black/50 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900/60 mb-1">
                    Kurumsal &amp; Bilgi
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

                  <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-t border-b border-zinc-900/60 my-1">
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

            {/* User Profile / Auth Area */}
            {user ? (
              <div className="flex items-center space-x-2 border-l border-zinc-800/80 pl-3 relative" ref={profileDropdownRef}>
                
                {/* Profile Pill Trigger */}
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center space-x-2 rounded-lg p-1.5 hover:bg-zinc-900/60 transition-all duration-200 cursor-pointer border ${
                    user.isPremium ? 'border-amber-500/20 bg-amber-500/[0.03]' : 'border-transparent hover:border-zinc-800'
                  }`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shadow-md ${
                    user.isPremium 
                      ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-zinc-950 shadow-amber-500/20' 
                      : 'bg-gradient-to-tr from-teal-500 to-emerald-500 text-zinc-950 shadow-teal-500/10'
                  }`}>
                    {getInitials(user.username)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-zinc-500 font-semibold leading-none">Oturum Açık</span>
                    <span className="text-xs font-bold text-zinc-200 leading-none mt-0.5 max-w-[80px] truncate flex items-center gap-0.5">
                      {user.username}
                      {user.isPremium && <Sparkles className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-zinc-500" />
                </button>

                {profileDropdownOpen && (
                  <div 
                    className="absolute right-20 top-12 mt-1.5 w-48 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl ring-1 ring-black/50 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div className="px-2.5 py-2 border-b border-zinc-900 mb-1">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Kullanıcı Hesabı</p>
                      <p className="text-xs font-bold text-teal-400 truncate flex items-center gap-1">
                        {user.username}
                        {user.isPremium && <span className="inline-flex items-center rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[8px] font-black tracking-widest px-1 py-0.5 leading-none shrink-0">PREMIUM</span>}
                      </p>
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

                {/* Direct High-Visibility Logout Button (Desktop only, next to profile pill) */}
                <button
                  onClick={() => {
                    onLogout();
                    navigate('/');
                  }}
                  id="nav-logout-direct-btn"
                  className="flex items-center space-x-1 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/25 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-all duration-200 cursor-pointer shadow-sm shadow-red-500/5 hover:scale-[1.02] active:scale-[0.98]"
                  title="Güvenli Çıkış"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Çıkış</span>
                </button>

              </div>
            ) : (
              <div className="flex items-center space-x-2 border-l border-zinc-800/80 pl-3">
                <Link
                  to="/giris"
                  id="nav-login-btn"
                  className="flex items-center space-x-1.5 rounded-lg border border-zinc-800/85 bg-zinc-900/30 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5 text-teal-400" />
                  <span>Giriş</span>
                </Link>
                
                <Link
                  to="/kayit"
                  id="nav-register-btn"
                  className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md shadow-teal-500/5 hover:shadow-teal-500/10"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Kayıt Ol</span>
                </Link>
              </div>
            )}

          </nav>

          {/* Mobile Right Bar Actions (Status + Hamburger menu) */}
          <div className="flex md:hidden items-center space-x-2">
            
            {/* Minimalist Status indicator on mobile */}
            {systemStatus && (
              <div 
                className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                  systemStatus.isCloudinaryConfigured ? 'border-teal-500/10 bg-teal-500/5 text-teal-400' : 'border-amber-500/10 bg-amber-500/5 text-amber-500'
                }`}
                title={systemStatus.isCloudinaryConfigured ? "Bulut Depolama" : "Yerel Depolama"}
              >
                {systemStatus.isCloudinaryConfigured ? (
                  <Cloud className="h-3.5 w-3.5" />
                ) : (
                  <Database className="h-3.5 w-3.5" />
                )}
              </div>
            )}

            {/* Hamburger Trigger button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              aria-label="Menüyü Aç"
              id="mobile-menu-trigger"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

        </div>
      </header>

      {/* FULL-SCREEN SLIDE-OUT MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden md:hidden"
          id="mobile-menu-overlay"
        >
          {/* Backdrop Blur and Dark fade */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ease-out animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content Body */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-zinc-950 border-l border-zinc-900 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 ease-out">
              
              {/* Header inside the Drawer */}
              <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/10">
                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Image className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-sm font-black text-white">AnındaResim Menü</span>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white bg-zinc-900/30 active:scale-90 cursor-pointer"
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Main Scrolling Body of Drawer */}
              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-7">
                
                {/* User Info Card in Drawer */}
                <div>
                  {user ? (
                    <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-inner relative overflow-hidden">
                      {/* Accent glow */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
                      
                      <div className="flex items-center space-x-3 relative z-10">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-black shadow-md ${
                          user.isPremium 
                            ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-zinc-950 shadow-amber-500/20 animate-pulse' 
                            : 'bg-gradient-to-tr from-teal-500 to-emerald-500 text-zinc-950 shadow-teal-500/10'
                        }`}>
                          {getInitials(user.username)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Oturum Sahibi</p>
                          <h4 className="text-sm font-extrabold text-white truncate mt-0.5 flex items-center gap-1">
                            {user.username}
                            {user.isPremium && <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400 inline" />}
                          </h4>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 ${
                            user.isAdmin ? 'bg-rose-400/10 text-rose-400' : user.isPremium ? 'bg-amber-400/10 text-amber-400 border border-amber-500/20' : 'bg-teal-400/10 text-teal-400'
                          }`}>
                            {user.isAdmin ? 'Yönetici Hesabı' : user.isPremium ? 'Premium Üye' : 'Standart Üye'}
                          </span>
                        </div>
                      </div>

                      {/* Explicit Logout Button inside account card */}
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onLogout();
                          navigate('/');
                        }}
                        className="w-full mt-4 flex items-center justify-center space-x-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 py-2.5 text-xs font-bold text-red-400 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Oturumu Kapat (Çıkış Yap)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-4 text-center">
                      <p className="text-xs text-zinc-400 font-medium mb-3">Hesabınıza giriş yaparak yüklediğiniz resimleri arşivleyebilirsiniz.</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to="/giris"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-200 active:scale-95 transition-all"
                        >
                          <LogIn className="h-3.5 w-3.5 text-teal-400" />
                          <span>Giriş Yap</span>
                        </Link>
                        <Link
                          to="/kayit"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-center space-x-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-3 py-2 text-xs font-black text-zinc-950 active:scale-95 transition-all shadow-md shadow-teal-500/5"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Kayıt Ol</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Navigation Links */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-1.5">Ana Menü</h5>
                  
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors ${
                      location.pathname === '/' 
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/10' 
                        : 'text-zinc-300 hover:bg-zinc-900/50 hover:text-white'
                    }`}
                  >
                    <Sparkles className="h-4.5 w-4.5 text-teal-400" />
                    <span>Görsel Yükleme Paneli</span>
                  </Link>

                  {systemStatus?.premiumEnabled && (
                    <Link
                      to="/premium"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-bold transition-colors ${
                        location.pathname === '/premium' 
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
                          : 'text-amber-400 hover:bg-amber-500/5'
                      }`}
                    >
                      <Sparkles className="h-4.5 w-4.5 text-amber-400 fill-amber-400/20 animate-pulse" />
                      <span>Premium Paketler</span>
                    </Link>
                  )}

                  {user && (
                    <Link
                      to="/galerim"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors ${
                        location.pathname === '/galerim' 
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/10' 
                          : 'text-zinc-300 hover:bg-zinc-900/50 hover:text-white'
                      }`}
                    >
                      <Grid className="h-4.5 w-4.5 text-teal-400" />
                      <span>Benim Görsellerim</span>
                    </Link>
                  )}

                  {user?.isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors ${
                        location.pathname === '/admin' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' 
                          : 'text-rose-400/80 hover:bg-rose-500/5'
                      }`}
                    >
                      <ShieldAlert className="h-4.5 w-4.5" />
                      <span>Yönetici Paneli (Admin)</span>
                    </Link>
                  )}
                </div>

                {/* Informational Pages Links */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-1.5">Kurumsal &amp; Yardım</h5>
                  
                  <Link
                    to="/hakkimizda"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-zinc-900/50 hover:text-white transition-colors"
                  >
                    <Info className="h-4.5 w-4.5 text-teal-400" />
                    <span>Hakkımızda &amp; Altyapı</span>
                  </Link>

                  <Link
                    to="/sartlar"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-zinc-900/50 hover:text-white transition-colors"
                  >
                    <FileText className="h-4.5 w-4.5 text-teal-400" />
                    <span>Kullanım Koşulları</span>
                  </Link>

                  <Link
                    to="/yardim"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-zinc-900/50 hover:text-white transition-colors"
                  >
                    <HelpCircle className="h-4.5 w-4.5 text-teal-400" />
                    <span>SSS &amp; Kılavuz</span>
                  </Link>
                </div>

                {/* Destek & DMCA Bildirim Links */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-1.5">Destek &amp; Bildirim</h5>
                  
                  <Link
                    to="/ihbar"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
                  >
                    <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
                    <span>İhlal Bildirimi (DMCA)</span>
                  </Link>

                  <Link
                    to="/destek"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-zinc-900/50 hover:text-white transition-colors"
                  >
                    <MessageSquare className="h-4.5 w-4.5 text-teal-400" />
                    <span>7/24 Teknik Destek</span>
                  </Link>
                </div>

              </div>

              {/* Footer inside the Drawer */}
              <div className="p-5 border-t border-zinc-900 bg-zinc-950/90 text-center">
                <div className="flex items-center justify-center space-x-2 text-xs text-zinc-500 font-semibold mb-1">
                  <span>Sistem Altyapısı:</span>
                  {systemStatus?.isCloudinaryConfigured ? (
                    <span className="text-teal-400 flex items-center space-x-1 font-bold">
                      <Cloud className="h-3.5 w-3.5 inline mr-0.5" />
                      Cloudinary Bulut
                    </span>
                  ) : (
                    <span className="text-amber-500 flex items-center space-x-1 font-bold">
                      <Database className="h-3.5 w-3.5 inline mr-0.5" />
                      Yerel Sunucu
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-600 font-medium">© 2026 AnındaResim. Tüm hakları saklıdır.</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
