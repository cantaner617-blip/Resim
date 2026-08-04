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
import { motion, AnimatePresence } from 'motion/react';

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
      <AnimatePresence>
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-50 overflow-hidden md:hidden"
            id="mobile-menu-overlay"
          >
            {/* Backdrop Blur and Dark fade */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Content Body */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-6">
              <motion.div 
                initial={{ x: '100%', filter: 'blur(5px)' }}
                animate={{ x: 0, filter: 'blur(0px)' }}
                exit={{ x: '100%', filter: 'blur(5px)' }}
                transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                className="w-screen max-w-sm bg-zinc-950/95 border-l border-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-between backdrop-blur-xl"
              >
                
                {/* Header inside the Drawer */}
                <div className="px-6 py-5 border-b border-zinc-900/60 flex items-center justify-between bg-zinc-950/40">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-lg shadow-teal-500/5">
                      <Image className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black tracking-tight text-white">AnındaResim</span>
                      <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Navigasyon</span>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-900 text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-900 active:scale-90 transition-colors cursor-pointer"
                    aria-label="Kapat"
                  >
                    <X className="h-4.5 w-4.5" />
                  </motion.button>
                </div>

                {/* Main Scrolling Body of Drawer */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scrollbar-thin">
                  
                  {/* User Info Card in Drawer */}
                  <div>
                    {user ? (
                      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-900 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                        
                        <div className="flex items-center space-x-4 relative z-10">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black shadow-lg ${
                            user.isPremium 
                              ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-zinc-950 shadow-amber-500/25 animate-pulse' 
                              : 'bg-gradient-to-tr from-teal-500 to-emerald-500 text-zinc-950 shadow-teal-500/10'
                          }`}>
                            {getInitials(user.username)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Oturum Açık</p>
                            <h4 className="text-sm font-black text-white truncate mt-0.5 flex items-center gap-1.5">
                              {user.username}
                              {user.isPremium && <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400 inline" />}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black mt-1.5 uppercase tracking-wider ${
                              user.isAdmin 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : user.isPremium 
                                  ? 'bg-amber-400/10 text-amber-400 border border-amber-500/20' 
                                  : 'bg-teal-400/10 text-teal-400 border border-teal-500/20'
                            }`}>
                              {user.isAdmin ? 'Yönetici' : user.isPremium ? 'Premium Üye' : 'Standart Üye'}
                            </span>
                          </div>
                        </div>

                        {/* Explicit Logout Button inside account card */}
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onLogout();
                            navigate('/');
                          }}
                          className="w-full mt-5 flex items-center justify-center space-x-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 py-2.5 text-xs font-bold text-red-400 transition-all cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Oturumu Kapat</span>
                        </motion.button>
                      </div>
                    ) : (
                      <div className="bg-zinc-900/20 border border-dashed border-zinc-900 rounded-2xl p-5 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl -ml-6 -mt-6 pointer-events-none" />
                        <p className="text-xs text-zinc-400 leading-relaxed mb-4 font-medium relative z-10">
                          Resimlerinizi ömür boyu saklamak, kategorize etmek ve dilediğiniz an erişmek için ücretsiz hesap açın!
                        </p>
                        <div className="grid grid-cols-2 gap-2.5 relative z-10">
                          <Link
                            to="/giris"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-center space-x-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs font-black text-zinc-200 hover:text-white hover:bg-zinc-900 transition-all active:scale-95"
                          >
                            <LogIn className="h-3.5 w-3.5 text-teal-400" />
                            <span>Giriş Yap</span>
                          </Link>
                          <Link
                            to="/kayit"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-center space-x-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 px-3 py-2.5 text-xs font-black text-zinc-950 transition-all active:scale-95 shadow-lg shadow-teal-500/10"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Kayıt Ol</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Primary Navigation Links */}
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Ana Menü</h5>
                    
                    <div className="space-y-1.5">
                      <Link
                        to="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3.5 px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                          location.pathname === '/' 
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/10 font-black shadow-inner' 
                            : 'text-zinc-400 hover:bg-zinc-900/30 hover:text-white'
                        }`}
                      >
                        <Image className="h-4 w-4 text-teal-400 shrink-0" />
                        <span className="flex-1">Görsel Yükleme Paneli</span>
                        {location.pathname === '/' && <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />}
                      </Link>

                      {systemStatus?.premiumEnabled && (
                        <Link
                          to="/premium"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3.5 px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                            location.pathname === '/premium' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10 font-black' 
                              : 'text-amber-400 hover:bg-amber-500/5'
                          }`}
                        >
                          <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400/10 shrink-0 animate-pulse" />
                          <span className="flex-1">Premium Paketler</span>
                          {location.pathname === '/premium' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                        </Link>
                      )}

                      {user && (
                        <Link
                          to="/galerim"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3.5 px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                            location.pathname === '/galerim' 
                              ? 'bg-teal-500/10 text-teal-400 border border-teal-500/10 font-black' 
                              : 'text-zinc-400 hover:bg-zinc-900/30 hover:text-white'
                        }`}
                      >
                        <Grid className="h-4 w-4 text-teal-400 shrink-0" />
                        <span className="flex-1">Benim Görsellerim</span>
                        {location.pathname === '/galerim' && <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />}
                      </Link>
                      )}

                      {user?.isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3.5 px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                            location.pathname === '/admin' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10 font-black' 
                              : 'text-rose-400 hover:bg-rose-500/5'
                          }`}
                        >
                          <Shield className="h-4 w-4 text-rose-400 shrink-0" />
                          <span className="flex-1">Yönetici Paneli</span>
                          {location.pathname === '/admin' && <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Informational Pages Links */}
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Kurumsal &amp; Yardım</h5>
                    
                    <div className="space-y-1">
                      <Link
                        to="/hakkimizda"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          location.pathname === '/hakkimizda' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-900/20 hover:text-white'
                        }`}
                      >
                        <Info className="h-4 w-4 text-teal-400 shrink-0" />
                        <span>Hakkımızda &amp; Altyapı</span>
                      </Link>

                      <Link
                        to="/sartlar"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          location.pathname === '/sartlar' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-900/20 hover:text-white'
                        }`}
                      >
                        <FileText className="h-4 w-4 text-teal-400 shrink-0" />
                        <span>Kullanım Koşulları</span>
                      </Link>

                      <Link
                        to="/yardim"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          location.pathname === '/yardim' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-900/20 hover:text-white'
                        }`}
                      >
                        <HelpCircle className="h-4 w-4 text-teal-400 shrink-0" />
                        <span>SSS &amp; Kılavuz</span>
                      </Link>
                    </div>
                  </div>

                  {/* Destek & DMCA Bildirim Links */}
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Güvenlik &amp; İletişim</h5>
                    
                    <div className="space-y-1">
                      <Link
                        to="/ihbar"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          location.pathname === '/ihbar' ? 'bg-red-950/20 text-red-400 border border-red-900/20' : 'text-red-400/80 hover:bg-red-950/10 hover:text-red-400'
                        }`}
                      >
                        <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
                        <span>İhlal Bildirimi (DMCA)</span>
                      </Link>

                      <Link
                        to="/destek"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          location.pathname === '/destek' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-900/20 hover:text-white'
                        }`}
                      >
                        <MessageSquare className="h-4 w-4 text-teal-400 shrink-0" />
                        <span>7/24 Teknik Destek</span>
                      </Link>
                    </div>
                  </div>

                </div>

                {/* Footer inside the Drawer */}
                <div className="p-6 border-t border-zinc-900 bg-zinc-950 text-center space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                    <span>Sistem Durumu:</span>
                    {systemStatus?.isCloudinaryConfigured ? (
                      <span className="text-teal-400 flex items-center space-x-1 font-extrabold bg-teal-500/5 px-2 py-0.5 rounded border border-teal-500/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping mr-1" />
                        Cloudinary
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center space-x-1 font-extrabold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse mr-1" />
                        Yerel Depo
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-600 font-bold">© 2026 AnındaResim. Tüm Hakları Saklıdır.</p>
                </div>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
