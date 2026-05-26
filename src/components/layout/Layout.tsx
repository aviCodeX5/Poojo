import React from 'react';
import Navbar from './Navbar';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector } from '../language/LanguageSelector';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { committee, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background-cream">
      <Navbar />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-blue-100 flex items-center justify-between px-8 shadow-sm z-40 flex-shrink-0">
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-accent tracking-tight leading-none">
              {committee?.name || t('app.name')}
            </h2>
            {committee && (
              <p className="text-[10px] text-slate-500 font-mono font-bold mt-1">
                ID: {committee.committeeId || committee.id}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSelector className="hidden sm:inline-flex" />
            <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 text-seagreen px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
              <span className="w-1.5 h-1.5 bg-seagreen rounded-full animate-pulse"></span>
              <span>{t('status.online')}</span>
            </div>
            
            <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>
            
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-blue-50"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 pb-32 md:pb-8 no-scrollbar bg-background-cream">
          {children}
        </div>
      </main>
    </div>
  );
}
