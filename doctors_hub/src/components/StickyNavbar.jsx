import React, { useState, useRef, useEffect } from 'react';
import { Stethoscope, Smartphone, LogIn, Menu, X, HeartPulse, ChevronDown, Settings, LogOut, User, LayoutDashboard } from 'lucide-react';

export default function StickyNavbar({ activeTab, setActiveTab, user, onOpenLogin, onOpenSettings, onLogout, onOpenAppModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Doctors', id: 'doctors' },
    { name: 'Diagnostics', id: 'diagnostics' },
    { name: 'Hospitals', id: 'hospitals' },
    { name: 'Contact', id: 'contact' },
  ];

  const getInitials = () => {
    if (!user) return 'P';
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (!fullName) return user.phone_number ? user.phone_number.substring(0, 2) : 'P';
    const parts = fullName.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return fullName.substring(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return 'Patient';
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || `+880 ${user.phone_number}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Doctors<span className="text-emerald-600">Hub</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">.bd</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide">
              Doctors, Diagnostics & Hospitals Portal Bangladesh
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  const el = document.getElementById(link.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-700 bg-emerald-50 shadow-sm border border-emerald-200/60'
                    : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </button>
            );
          })}
        </nav>

        {/* Right CTA Group: App Indicator & Profile / Login Button */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Admin Portal Direct Button if is_staff */}
          {user?.is_staff && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-teal-400 border border-slate-700'
                  : 'bg-slate-900/90 hover:bg-slate-900 text-slate-200 border border-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-teal-400" />
              <span>Admin Portal</span>
            </button>
          )}

          {/* App Download Indicator */}
          <button
            onClick={onOpenAppModal}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-700 text-xs font-semibold transition-all shadow-xs"
          >
            <Smartphone className="w-4 h-4 text-emerald-600 animate-bounce" />
            <div className="text-left">
              <div className="leading-none text-[10px] text-slate-400 uppercase tracking-wider">Get Mobile</div>
              <div className="leading-none font-bold text-slate-800 text-xs">Download App</div>
            </div>
          </button>

          {/* User Profile Avatar Icon / Login Button */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition-all shadow-sm focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shadow-xs relative">
                  {getInitials()}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></span>
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                    {getUserDisplayName()}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold leading-tight">
                    {user.is_staff ? 'Admin Staff' : 'Patient Account'}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Settings Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{getUserDisplayName()}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">+880 {user.phone_number}</p>
                  </div>

                  <div className="py-1">
                    {user.is_staff && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setActiveTab('admin');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-teal-700 bg-teal-50/70 hover:bg-teal-100 flex items-center gap-2.5 transition-colors border-b border-slate-100"
                      >
                        <LayoutDashboard className="w-4 h-4 text-teal-600" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-emerald-600" />
                      <span>User Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>


        {/* Mobile Hamburger Toggle */}
        <div className="flex lg:hidden items-center gap-2">
          {user && (
            <button
              onClick={() => onOpenSettings()}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs mr-1"
            >
              {getInitials()}
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg animate-fadeIn">
          {user && (
            <div className="p-3 bg-slate-50 rounded-xl mb-3 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{getUserDisplayName()}</p>
                <p className="text-[11px] text-slate-500">+880 {user.phone_number}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="px-2.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg hover:bg-emerald-200"
              >
                Settings
              </button>
            </div>
          )}

          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setMobileMenuOpen(false);
                const el = document.getElementById(link.id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold ${
                activeTab === link.id
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </button>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenAppModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold bg-slate-50"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Download DoctorHub App</span>
            </button>

            {user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-rose-50 text-rose-600 font-bold text-sm border border-rose-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
