import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Image, LogIn, LogOut, UserPlus, Grid, Cloud, Database, ShieldAlert } from 'lucide-react';
import { User, SystemStatus } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  systemStatus: SystemStatus | null;
}

export default function Navbar({ user, onLogout, systemStatus }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <header id="site-header" className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
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
            Resim<span className="text-teal-400">Yükle</span>
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

          {/* Profile Actions */}
          {user ? (
            <div className="flex items-center space-x-1 sm:space-x-2 border-l border-zinc-800 pl-1.5 sm:pl-4">
              <span className="hidden lg:inline-block text-sm text-zinc-400 mr-1">
                Merhaba, <strong className="text-zinc-200 font-semibold">{user.username}</strong>
              </span>
              <button
                onClick={() => {
                  onLogout();
                  navigate('/');
                }}
                id="nav-logout-btn"
                className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2 sm:px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all duration-200 cursor-pointer"
                title="Çıkış Yap"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Çıkış Yap</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1 sm:space-x-2 border-l border-zinc-800 pl-1.5 sm:pl-4">
              <Link
                to="/giris"
                id="nav-login-btn"
                className="flex items-center space-x-1.5 rounded-lg px-2 sm:px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all duration-200"
              >
                <LogIn className="h-4 w-4 text-zinc-400" />
                <span className="hidden sm:inline">Giriş Yap</span>
              </Link>
              
              <Link
                to="/kayit"
                id="nav-register-btn"
                className="flex items-center space-x-1.5 rounded-lg bg-teal-500 px-2 sm:px-3.5 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 active:scale-95 transition-all duration-200"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Kayıt Ol</span>
              </Link>
            </div>
          )}

        </nav>
      </div>
    </header>
  );
}
