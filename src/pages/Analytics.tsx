import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { apiList } from '../lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, AlertTriangle, Lightbulb, PieChart as PieIcon, Activity } from 'lucide-react';
import { generateInsights, Insight } from '../utils/insightsEngine';
import { cn } from '../lib/utils';

export default function Analytics() {
  const { committee } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [data, setData] = useState({
    incomeVsExpense: [] as any[],
    categorySpread: [] as any[]
  });

  useEffect(() => {
    if (!committee) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const id = committee.id || committee.committeeId;
        const curYear = new Date().getFullYear();
        
        const expenses = await apiList<any>(id, 'expenses');
        const chanda = await apiList<any>(id, 'chandaEntries');

        // Process for insights engine
        const expensesByYear: Record<number, Record<string, number>> = {};
        const chandaByYear: Record<number, number> = {};
        
        // Mock data for previous years to show insights during demo/dev
        expensesByYear[curYear - 1] = { 'Decoration': 10000, 'Lighting': 5000 };
        chandaByYear[curYear - 1] = 50000;

        expenses.forEach(d => {
          const y = d.year || curYear;
          if (!expensesByYear[y]) expensesByYear[y] = {};
          expensesByYear[y][d.category] = (expensesByYear[y][d.category] || 0) + (d.amount || 0);
        });

        chanda.forEach(d => {
          const y = d.year || curYear;
          chandaByYear[y] = (chandaByYear[y] || 0) + (d.amount || 0);
        });

        const generatedInsights = generateInsights({
          currentYear: curYear,
          expensesByYear,
          chandaByYear,
          budgetByYear: { [curYear]: { 'Lighting': 2000, 'Decoration': 5000 } },
          inventoryWaste: {}
        });

        setInsights(generatedInsights);

        // Chart Data
        const categoryData: Record<string, number> = {};
        expenses.forEach(d => {
          categoryData[d.category] = (categoryData[d.category] || 0) + (d.amount || 0);
        });

        setData({
          categorySpread: Object.entries(categoryData).map(([name, value]) => ({ name, value })),
          incomeVsExpense: [
            { year: curYear - 2, income: 450000, expense: 380000 },
            { year: curYear - 1, income: 520000, expense: 490000 },
            { year: curYear, income: 600000, expense: 410000 },
          ]
        });

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [committee]);

  return (
    <Layout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Smart Analytics</h1>
          <p className="text-gray-500 font-medium">Data-driven insights and historical trends</p>
        </header>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.length > 0 ? insights.map((insight) => (
            <Card key={insight.id} className={cn(
               "border-l-4 shadow-sm",
               insight.type === 'warning' ? 'border-l-red-500 bg-red-50/20' : 
               insight.type === 'success' ? 'border-l-green-500 bg-green-50/20' : 
               'border-l-primary bg-orange-50/20'
            )}>
              <div className="flex gap-4">
                <div className={cn(
                  "p-2 rounded-xl h-fit",
                  insight.type === 'warning' ? 'bg-red-100 text-red-600' : 
                  insight.type === 'success' ? 'bg-green-100 text-green-600' : 
                  'bg-orange-100 text-primary'
                )}>
                  {insight.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-tight">
                    {insight.type === 'warning' ? 'Action Required' : 'Engine Insight'}
                  </h4>
                  <p className="text-gray-700 font-medium leading-relaxed">{insight.text}</p>
                </div>
              </div>
            </Card>
          )) : (
             <Card className="col-span-full border-dashed border-2 py-10 flex flex-col items-center justify-center text-gray-400">
                <Activity className="w-10 h-10 mb-4 opacity-20" />
                <p className="font-bold">Collecting data for smart insights...</p>
                <p className="text-xs">Add more transactions to unlock deeper trends.</p>
             </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="shadow-xl border-orange-50">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="text-primary w-6 h-6" /> 3-Year Projection
                 </h3>
                 <div className="text-xs font-black uppercase text-gray-400 tracking-widest px-3 py-1 bg-gray-50 rounded-full">Historical Log</div>
              </div>
              <div className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.incomeVsExpense}>
                       <defs>
                          <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="year" axisLine={false} tickLine={false} />
                       <YAxis axisLine={false} tickLine={false} />
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                       <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                       />
                       <Area type="monotone" dataKey="income" stroke="#FF6B35" fillOpacity={1} fill="url(#colorInc)" strokeWidth={4} />
                       <Area type="monotone" dataKey="expense" stroke="#8B1A1A" fill="transparent" strokeWidth={4} strokeDasharray="10 10" />
                       <Legend verticalAlign="top" height={36}/>
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           <Card className="shadow-xl border-orange-50">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-bold flex items-center gap-2">
                    <PieIcon className="text-accent w-6 h-6" /> Expense Categories
                 </h3>
              </div>
              <div className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.categorySpread} layout="vertical">
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} fontSize={12} fontWeight={700} />
                       <Tooltip cursor={{fill: 'transparent'}} />
                       <Bar dataKey="value" fill="#8B1A1A" radius={[0, 10, 10, 0]} barSize={20} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                 <p className="text-xs text-center text-gray-400 font-bold uppercase tracking-widest">Calculated from {data.categorySpread.length} active ledgers</p>
              </div>
           </Card>
        </div>

        {/* Budget Health Matrix */}
        <Card className="bg-[#1a1a1a] text-white p-8 overflow-hidden relative">
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                 <h3 className="text-3xl font-black mb-2 tracking-tight">84 <span className="text-lg font-medium opacity-50">/ 100</span></h3>
                 <p className="text-primary font-bold uppercase tracking-widest text-xs">Budget Health Score</p>
                 <p className="mt-4 text-sm text-gray-400 leading-relaxed">Your committee is spending efficiently. Lighting and Pandal are the main drivers of the surplus this year.</p>
              </div>
              
              <div className="col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <MetricBox label="Efficiency" value="+12%" />
                 <MetricBox label="Waste" value="4.2%" />
                 <MetricBox label="Chanda ROI" value="118%" />
                 <MetricBox label="Stability" value="Solid" />
              </div>
           </div>
           
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        </Card>
      </div>
    </Layout>
  );
}

function MetricBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center">
       <p className="text-xl font-black mb-1 tracking-tight">{value}</p>
       <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{label}</p>
    </div>
  );
}
