import { Link, useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { BrandLogo } from '../brand/BrandLogo';
import { LanguageSelector } from '../language/LanguageSelector';
import { cn } from '../../lib/utils';
import {
  Bell,
  Boxes,
  Building2,
  Calendar,
  FilePieChart,
  Landmark,
  LayoutDashboard,
  Receipt,
  Settings2,
  Shield,
  Users2,
} from 'lucide-react';

export default function Navbar() {
  const { role, isAdmin, canBroadcast, hasModuleAccess, committeeId } = usePermissions();
  const { member } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const canViewOrgChart = role === 'ADMIN' || role === 'SECRETARY' || role === 'JOINT_SECRETARY';

  const primaryNav = [
    { label: t('nav.dashboard'), icon: LayoutDashboard, path: `/${committeeId}/dashboard`, show: true },
    { label: t('nav.members'), icon: Users2, path: `/${committeeId}/members`, show: isAdmin },
    { label: t('nav.orgChart'), icon: Building2, path: `/${committeeId}/org-chart`, show: canViewOrgChart },
    { label: t('nav.chandaDonations'), icon: Landmark, path: `/${committeeId}/donations`, show: true },
    { label: t('nav.expenses'), icon: Receipt, path: `/${committeeId}/expenses`, show: true },
    { label: t('nav.inventory'), icon: Boxes, path: `/${committeeId}/inventory`, show: true },
    { label: t('nav.analytics'), icon: FilePieChart, path: `/${committeeId}/analytics`, show: true },
  ];

  const systemNav = [
    { label: t('nav.broadcasts'), icon: Bell, path: `/${committeeId}/broadcasts`, show: canBroadcast },
    { label: t('nav.pujaEditions'), icon: Calendar, path: `/${committeeId}/puja-editions`, show: isAdmin },
    { label: t('nav.roleManagement'), icon: Shield, path: `/${committeeId}/role-management`, show: isAdmin },
    { label: t('nav.settings'), icon: Settings2, path: `/${committeeId}/settings`, show: isAdmin },
  ];

  const activePath = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-blue-700 text-white border-r border-blue-800 h-screen sticky top-0 shadow-2xl">
        <div className="p-6">
          <BrandLogo showTagline light />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="text-[10px] text-white/40 uppercase tracking-widest px-3 mb-2 font-bold select-none">{t('nav.main')}</div>
          {primaryNav.filter(i => i.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-semibold group',
                activePath(item.path)
                  ? 'bg-primary text-white shadow-lg shadow-black/10'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className={cn('w-4 h-4 transition-colors', activePath(item.path) ? 'text-white' : 'text-white/40 group-hover:text-white')} />
              {item.label}
            </Link>
          ))}

          <div className="pt-6">
            <div className="text-[10px] text-white/40 uppercase tracking-widest px-3 mb-2 font-bold select-none">{t('nav.system')}</div>
            {systemNav.filter(i => i.show).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-semibold group',
                  activePath(item.path)
                    ? 'bg-primary text-white shadow-lg shadow-black/10'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className={cn('w-4 h-4 transition-colors', activePath(item.path) ? 'text-white' : 'text-white/40 group-hover:text-white')} />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 bg-blue-900/35 border-t border-blue-800 space-y-3">
          <LanguageSelector light className="w-full" />
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-primary flex items-center justify-center text-accent font-black text-xs">
              {isAdmin ? 'AD' : member?.name.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate">{isAdmin ? 'Admin' : member?.name}</p>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">{role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-blue-700 border border-blue-800 z-50 h-16 px-2 flex items-center justify-between shadow-2xl rounded-2xl">
        {primaryNav.filter((_, i) => [0, 2, 4, 5].includes(i)).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full rounded-xl',
              activePath(item.path) ? 'bg-primary text-white shadow-lg shadow-black/10' : 'text-white/40'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
