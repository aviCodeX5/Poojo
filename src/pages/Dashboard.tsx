import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { apiList } from '../lib/api';
import {
  IndianRupee, TrendingUp, TrendingDown, Users,
  BarChart, Wallet, CreditCard, ChevronRight, Bell, Calendar, Settings
} from 'lucide-react';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { committee, currentEdition } = useAuth();
  const { role } = usePermissions();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalChanda: 0,
    totalExpenses: 0,
    memberCount: 0
  });
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [pendingChanda, setPendingChanda] = useState<any[]>([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState<Array<{ name: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!committee) return;

    const fetchStats = async () => {
      try {
        const id = committee.id || committee.committeeId;
        
        // 1. Fetch Summary Stats
        const [donations, chanda, expenses, members] = await Promise.all([
          apiList<any>(id, 'donations'),
          apiList<any>(id, 'chandaEntries'),
          apiList<any>(id, 'expenses'),
          apiList<any>(id, 'members'),
        ]);

        const editionFilter = (doc: any) => !currentEdition?.id || doc.editionId === currentEdition.id || doc.year === currentEdition.year;
        const scopedDonations = donations.filter(editionFilter);
        const scopedChanda = chanda.filter(editionFilter);
        const scopedExpenses = expenses.filter(editionFilter);

        const dTotal = scopedDonations.reduce((acc, doc) => acc + (doc.amount || 0), 0);
        const cTotal = scopedChanda.reduce((acc, doc) => acc + (doc.amount || 0), 0);
        const eTotal = scopedExpenses.reduce((acc, doc) => acc + (doc.amount || 0), 0);

        setStats({
          totalDonations: dTotal,
          totalChanda: cTotal,
          totalExpenses: eTotal,
          memberCount: members.length
        });

        setRecentExpenses(scopedExpenses.sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5));
        setPendingChanda(scopedChanda.filter((entry) => entry.status === 'Pending').slice(0, 4));
        const categoryTotals = scopedExpenses.reduce((acc: Record<string, number>, expense) => {
          const category = expense.category || 'Miscellaneous';
          acc[category] = (acc[category] || 0) + (expense.amount || 0);
          return acc;
        }, {});
        setExpenseCategoryData(Object.entries(categoryTotals).map(([name, value]) => ({ name, value })));

      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [committee, currentEdition?.id]);

  const surplus = (stats.totalDonations + stats.totalChanda) - stats.totalExpenses;

  const chartData = [
    { name: 'Donations', value: stats.totalDonations },
    { name: 'Chanda', value: stats.totalChanda },
  ];

  const COLORS = ['#FF6B35', '#8B1A1A', '#FF9F1C', '#2EC4B6', '#E71D36'];

  if (loading) return (
     <Layout>
        <div className="flex items-center justify-center h-full">
           <div className="animate-pulse text-primary font-black uppercase tracking-widest text-sm">Synchronizing Puja Data...</div>
        </div>
     </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Current Edition Display */}
        {!currentEdition ? (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-blue-950">Create a Puja Edition to start the flow</h2>
                <p className="mt-1 text-sm font-semibold text-blue-700">No active edition is selected, so this dashboard avoids stale historical totals.</p>
              </div>
              <Button onClick={() => navigate(`/${committee?.id || committee?.committeeId}/puja-editions`)}>
                <Calendar className="w-4 h-4 mr-2" /> Make Puja Edition
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {currentEdition.year} - {currentEdition.pujaType}
                  </h2>
                  {currentEdition.editionName && (
                    <p className="text-sm text-gray-600">{currentEdition.editionName}</p>
                  )}
                  {currentEdition.committeeDesignation && (
                    <p className="text-xs text-gray-500">{currentEdition.committeeDesignation}</p>
                  )}
                  {currentEdition.theme && (
                    <p className="text-xs text-primary font-medium">Theme: {currentEdition.theme}</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/${committee?.id || committee?.committeeId}/puja-editions`)}
              >
                <Settings className="w-4 h-4 mr-2" /> Manage Editions
              </Button>
            </div>
          </Card>
        )}

        {/* Top Cards - Professional Polish Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Donations" 
            value={stats.totalDonations} 
            subtitle={currentEdition ? `${currentEdition.year} edition` : 'Create edition first'}
            emoji="🏦"
          />
          <StatCard 
            title="Chanda" 
            value={stats.totalChanda} 
            subtitle={`${pendingChanda.length} pending approvals`}
            emoji="🏵️"
          />
          <StatCard 
            title="Expenses" 
            value={stats.totalExpenses} 
            subtitle={`${Math.round((stats.totalExpenses / (stats.totalDonations + stats.totalChanda || 1)) * 100)}% of total income`}
            emoji="📉"
            isNegative
          />
          <StatCard 
            title="Net Surplus" 
            value={surplus} 
            subtitle={surplus >= 0 ? 'Current surplus' : 'Current deficit'}
            emoji="💰"
            isHighlighted
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
          {/* Main Chart Section */}
          <div className="lg:col-span-2 space-y-6">
             <Card className="flex flex-col">
                <div className="flex items-center justify-between mb-6">
                   <div>
                      <h3 className="font-black text-slate-800 tracking-tight">Financial Overview</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Monthly Collection Trends</p>
                   </div>
                   <select className="text-[10px] font-black uppercase tracking-widest border-orange-100 bg-orange-50/50 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer">
                      <option>September 2025</option>
                      <option>August 2025</option>
                   </select>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 107, 53, 0.05)' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #FFEBD6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#FF6B35" 
                        radius={[4, 4, 0, 0]} 
                        barSize={40} 
                      />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
             </Card>

             <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-800 tracking-tight">Recent Activity</h3>
                  <button onClick={() => navigate(`/${committee?.committeeId}/expenses`)} className="text-[10px] font-black text-primary hover:underline transition-all">VIEW ALL</button>
                </div>
                <div className="space-y-3">
                   {recentExpenses.length > 0 ? recentExpenses.map(ex => (
                      <div key={ex.id} className="flex items-center justify-between p-3 hover:bg-orange-50/50 rounded-xl transition-colors group cursor-default">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100 group-hover:bg-white transition-colors">
                               <CreditCard className="w-5 h-5 text-primary/40 group-hover:text-primary transition-all" />
                            </div>
                            <div>
                               <p className="font-black text-slate-800 leading-none text-sm">{ex.reason}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">{ex.category} • {format(new Date(ex.date), 'dd MMM')}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="font-black text-accent">-₹{ex.amount.toLocaleString()}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">to {ex.vendorName.substring(0,10)}</p>
                         </div>
                      </div>
                   )) : (
                     <div className="text-center py-8 text-[10px] font-black tracking-widest text-slate-400 uppercase">Archive is Empty</div>
                   )}
                </div>
             </Card>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-6">
             <div className="bg-white rounded-xl border border-orange-100 overflow-hidden flex flex-col shadow-sm">
                <div className="p-4 border-b border-orange-50 bg-orange-50/30 flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-widest text-accent">Pending Approvals</h3>
                  <span className="bg-accent text-white text-[9px] px-2 py-0.5 rounded-full font-black">{String(pendingChanda.length).padStart(2, '0')}</span>
                </div>
                <div className="flex-1 divide-y divide-orange-50">
                  {pendingChanda.length > 0 ? pendingChanda.map((entry) => (
                    <div key={entry.id} className="p-4 hover:bg-orange-50/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="text-xs font-black text-slate-800">{entry.donorName}</div>
                        <div className="text-[10px] font-mono font-black text-accent">₹{entry.amount.toLocaleString()}</div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">Collector: {entry.collectedBy}</p>
                    </div>
                  )) : (
                    <div className="p-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">No pending approvals</div>
                  )}
                </div>
             </div>

             <Card className="overflow-hidden relative">
                <h3 className="font-black text-slate-800 tracking-tight mb-6">Budget Distribution</h3>
                <div className="h-[180px] relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                           data={expenseCategoryData.length ? expenseCategoryData : chartData}
                           innerRadius={50}
                           outerRadius={70}
                           paddingAngle={4}
                           dataKey="value"
                           stroke="none"
                         >
                           {(expenseCategoryData.length ? expenseCategoryData : chartData).map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Pie>
                         <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #FFEBD6', fontSize: '10px', fontWeight: 'bold' }}
                         />
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest leading-tight">Total<br/><span className="text-slate-800 text-xs">Income</span></p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                   {(expenseCategoryData.length ? expenseCategoryData : chartData).map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2 px-2 py-1 bg-orange-50/30 rounded-lg">
                         <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter truncate">{d.name}</span>
                      </div>
                   ))}
                </div>
             </Card>
          </div>
        </div>

        {/* Quick Broadcast Banner */}
        <div className="bg-accent rounded-xl p-5 flex flex-col md:flex-row items-center justify-between text-white shadow-xl shadow-red-100 border border-accent-dark group relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-all duration-700"></div>
          <div className="flex items-center space-x-4 relative z-10 w-full md:w-auto">
            <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform duration-500">
              <Bell className="w-6 h-6 text-orange-200" />
            </div>
            <div>
              <p className="font-black text-sm tracking-tight">Broadcasting Hub</p>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5">Send collection summary to all members via WhatsApp</p>
            </div>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0 w-full md:w-auto relative z-10">
            <button 
              onClick={() => navigate(`/${committee?.committeeId}/broadcasts`)}
              className="flex-1 md:flex-none bg-white text-accent px-6 py-2.5 rounded-lg text-xs font-black shadow-lg hover:shadow-white/10 active:scale-95 transition-all"
            >
              Compose
            </button>
            <button className="flex-1 md:flex-none bg-primary text-white px-6 py-2.5 rounded-lg text-xs font-black shadow-lg hover:shadow-primary/20 active:scale-95 transition-all">
              Send Digest
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  emoji, 
  isNegative, 
  isHighlighted 
}: { 
  title: string, 
  value: number, 
  subtitle: string, 
  emoji: string, 
  isNegative?: boolean, 
  isHighlighted?: boolean 
}) {
  return (
    <Card className={cn(
      "border-orange-100 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300",
      isHighlighted && "bg-[#FFFBF5] border-orange-200"
    )} padding="md">
      <div className={cn(
        "text-[10px] font-black uppercase tracking-widest mb-1 transition-colors",
        isHighlighted ? "text-primary" : "text-slate-400"
      )}>
        {title}
      </div>
      <div className={cn(
        "text-2xl font-black tracking-tighter",
        isNegative ? "text-accent" : "text-slate-800"
      )}>
        ₹{value.toLocaleString()}
      </div>
      <div className={cn(
        "text-[10px] font-bold mt-2",
        isHighlighted || !isNegative ? "text-green-600" : "text-slate-500",
        isNegative && !isHighlighted && "text-slate-500",
        title === 'Chanda' && "text-primary"
      )}>
        {subtitle}
      </div>
      <div className="absolute -right-1 -bottom-2 opacity-5 text-4xl group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-500">
        {emoji}
      </div>
    </Card>
  );
}
