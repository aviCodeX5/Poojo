import { Link, useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import {
  Home, Users, Landmark, ShoppingBag,
  Settings, BarChart2, MessageSquare, Calendar, Palette,
  LayoutDashboard, Receipt, Boxes, FilePieChart, Bell, Settings2, Users2, Building2, Shield, Moon, Sun
} from 'lucide-react';

export default function Navbar() {
  const { role, isAdmin, canBroadcast, hasModuleAccess, committeeId } = usePermissions();
  const { committee, member, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const canViewOrgChart = role === 'ADMIN' || role === 'SECRETARY' || role === 'JOINT_SECRETARY';

  const primaryNav = [
    { label: 'Dashboard', icon: LayoutDashboard, path: `/${committeeId}/dashboard`, show: true },
    { label: 'Members', icon: Users2, path: `/${committeeId}/members`, show: isAdmin },
    { label: 'Org Chart', icon: Building2, path: `/${committeeId}/org-chart`, show: canViewOrgChart },
    { label: 'Chanda & Donations', icon: Landmark, path: `/${committeeId}/donations`, show: hasModuleAccess('donations') || hasModuleAccess('chanda') },
    { label: 'Expenses', icon: Receipt, path: `/${committeeId}/expenses`, show: hasModuleAccess('expenses') },
    { label: 'Inventory', icon: Boxes, path: `/${committeeId}/inventory`, show: hasModuleAccess('inventory') },
    { label: 'Analytics', icon: FilePieChart, path: `/${committeeId}/analytics`, show: true },
  ];

  const systemNav = [
    { label: 'Broadcasts', icon: Bell, path: `/${committeeId}/broadcasts`, show: canBroadcast },
    { label: 'Puja Editions', icon: Calendar, path: `/${committeeId}/puja-editions`, show: isAdmin },
    { label: 'Role Management', icon: Shield, path: `/${committeeId}/role-management`, show: isAdmin },
    { label: 'Settings', icon: Settings2, path: `/${committeeId}/settings`, show: isAdmin },
  ];

  const activePath = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 bg-accent text-white border-r border-accent-dark h-screen sticky top-0 shadow-2xl">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-2xl">🙏</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">PujaCommittee</h1>
            <p className="text-[9px] text-white/50 uppercase tracking-[0.2em] mt-1 font-bold">Committee OS</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="text-[10px] text-white/40 uppercase tracking-widest px-3 mb-2 font-bold select-none">Main Menu</div>
          {primaryNav.filter(i => i.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-semibold group",
                activePath(item.path) 
                  ? "bg-primary text-white shadow-lg shadow-black/10" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn("w-4 h-4 transition-colors", activePath(item.path) ? "text-white" : "text-white/40 group-hover:text-white")} />
              {item.label}
            </Link>
          ))}
          
          <div className="pt-6">
            <div className="text-[10px] text-white/40 uppercase tracking-widest px-3 mb-2 font-bold select-none">System</div>
            {systemNav.filter(i => i.show).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-semibold group",
                  activePath(item.path) 
                    ? "bg-primary text-white shadow-lg shadow-black/10" 
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className={cn("w-4 h-4 transition-colors", activePath(item.path) ? "text-white" : "text-white/40 group-hover:text-white")} />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 bg-accent-dark/50 border-t border-accent-dark">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-orange-200 border-2 border-primary flex items-center justify-center text-accent font-black text-xs">
                {isAdmin ? 'AD' : member?.name.substring(0,2).toUpperCase() || 'US'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate">{isAdmin ? 'Admin' : member?.name}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">{role.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-white" />
              ) : (
                <Sun className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-accent border border-accent-dark z-50 h-16 px-2 flex items-center justify-between shadow-2xl rounded-2xl">
        {primaryNav.filter((_, i) => [0, 2, 4, 5].includes(i)).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full rounded-xl",
              activePath(item.path) ? "bg-primary text-white shadow-lg shadow-black/10" : "text-white/40"
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

