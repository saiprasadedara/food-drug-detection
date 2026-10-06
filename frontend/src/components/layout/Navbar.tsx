import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, FlaskConical, BookOpen, Menu, X, Clock, User, LogOut } from 'lucide-react';
import AuthModal from '../AuthModal';
import HistoryDrawer from '../HistoryDrawer';
import { authService } from '../../services/api';

const navLinks = [
  { label: 'Research', href: '/' },
  { label: 'Intelligence', href: '/analyze' },
  { label: 'Data', href: '/#data-sources' },
  { label: 'Methodology', href: '/#methodology' },
  { label: 'About', href: '/#about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [user, setUser] = useState<any>(authService.getCurrentUser());
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? 'bg-surface/90 backdrop-blur-xl border-b border-surface-border'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-accent-cyan-dim border border-accent-cyan/20 
                              flex items-center justify-center transition-all duration-300 
                              group-hover:border-accent-cyan/40 group-hover:shadow-glow-cyan">
                <FlaskConical className="w-4 h-4 text-accent-cyan" />
              </div>
              <div className="hidden sm:block">
                <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-text-primary">
                  Food × Drug
                </span>
                <span className="block text-[9px] font-mono text-accent-cyan tracking-wider uppercase">
                  Molecular Intelligence
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="px-3.5 py-2 text-[13px] font-medium text-text-secondary 
                             hover:text-text-primary transition-colors duration-200
                             relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px 
                                   bg-accent-cyan transition-all duration-300 group-hover:w-3/4" />
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* History button */}
              <button
                onClick={() => setHistoryOpen(true)}
                title="View Analysis History"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono font-medium text-text-secondary hover:text-accent-cyan rounded-md border border-surface-border hover:bg-surface-100 transition-all"
              >
                <Clock className="w-3.5 h-3.5 text-accent-cyan" />
                History
              </button>

              {/* Main Analyze CTA */}
              <Link
                to="/analyze"
                className="flex items-center gap-2 px-3.5 py-1.5 text-[12px] font-mono 
                           font-semibold tracking-[0.08em] uppercase text-accent-cyan 
                           border border-accent-cyan/40 rounded-md bg-accent-cyan-dim
                           hover:bg-accent-cyan/20 transition-all duration-200 shadow-glow-cyan"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Analyze
              </Link>

              {/* Auth Button */}
              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-surface-border">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-text-primary bg-surface-100 px-2.5 py-1 rounded-md border border-surface-border">
                    <User className="w-3 h-3 text-accent-emerald" />
                    <span>{user.full_name || user.email.split('@')[0]}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 text-text-tertiary hover:text-accent-red rounded hover:bg-surface-100 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono text-text-secondary hover:text-text-primary rounded-md border border-surface-border hover:bg-surface-100 transition-all"
                >
                  <User className="w-3.5 h-3.5 text-text-tertiary" />
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-surface-50/95 backdrop-blur-xl border-t border-surface-border animate-fade-in-down">
            <div className="px-6 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="block px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-200/50 rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-surface-border my-2" />
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setHistoryOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-accent-cyan"
              >
                <Clock className="w-4 h-4 text-accent-cyan" />
                History Log
              </button>
              <Link
                to="/analyze"
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-mono font-semibold text-accent-cyan bg-accent-cyan-dim rounded-md"
              >
                <FlaskConical className="w-4 h-4" />
                Analyze Interaction
              </Link>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-accent-red flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out ({user.email})
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setAuthOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Global Modals */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
      />
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectAnalysis={(rec) => {
          // Navigate to analyze page with record params
          window.location.href = `/analyze?drug=${encodeURIComponent(rec.drug || rec.drug_name)}&food=${encodeURIComponent(rec.food || rec.food_name)}`;
        }}
      />
    </>
  );
}
