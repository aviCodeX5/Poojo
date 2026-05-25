import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { MandapSchedule } from '../types';
import { Flower2, Plus, Users, Clock, Calendar, Bookmark, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Mandap() {
  const { committee, member } = useAuth();
  const { role, hasModuleAccess } = usePermissions();
  const [schedules, setSchedules] = useState<MandapSchedule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    day: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    tithi: '',
    pujaName: '',
    startTime: '08:00',
    endTime: '10:00',
    mandapDetails: '',
    expenses: ''
  });

  const fetchSchedules = async () => {
    if (!committee) return;
    setLoading(true);
    try {
      const id = committee.id || committee.committeeId;
      const q = query(collection(db, 'committees', id, 'mandapSchedule'), orderBy('day', 'asc'));
      const snap = await getDocs(q);
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() } as MandapSchedule)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [committee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committee) return;

    try {
      const id = committee.id || committee.committeeId;
      const scheduleData: Omit<MandapSchedule, 'id'> = {
        day: Number(formData.day),
        date: formData.date,
        tithi: formData.tithi,
        pujaName: formData.pujaName,
        startTime: formData.startTime,
        endTime: formData.endTime,
        mandapDetails: formData.mandapDetails,
        expenses: Number(formData.expenses),
        enteredBy: member?.memberId || 'ADMIN'
      };

      await addDoc(collection(db, 'committees', id, 'mandapSchedule'), scheduleData);
      setFormData({
        day: '', 
        date: format(new Date(), 'yyyy-MM-dd'),
        tithi: '', pujaName: '',
        startTime: '08:00', endTime: '10:00',
        mandapDetails: '', expenses: ''
      });
      setIsAdding(false);
      fetchSchedules();
      alert('Mandap schedule updated!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight text-amber-600">Mandap Schedule</h1>
            <p className="text-gray-500 font-medium font-sans">Manage daily puja rituals, tithi, and ritual particulars</p>
          </div>
          {hasModuleAccess('mandapSchedule') && (
            <Button onClick={() => setIsAdding(!isAdding)} className="h-12 bg-amber-600 hover:bg-amber-700 shadow-amber-200">
               {isAdding ? 'Cancel' : <><Plus className="w-5 h-5 mr-2" /> Add Ritual</>}
            </Button>
          )}
        </header>

        {isAdding && (
          <Card className="border-2 border-amber-100 bg-amber-50/20">
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <Input label="Day No." type="number" required placeholder="1, 2, 3..." value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} />
                   <Input label="Date" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                   <Input label="Tithi" required placeholder="e.g. Maha Saptami" value={formData.tithi} onChange={e => setFormData({...formData, tithi: e.target.value})} />
                   <Input label="Puja / Ritual Name" required placeholder="e.g. Pushpanjali" value={formData.pujaName} onChange={e => setFormData({...formData, pujaName: e.target.value})} />
                   
                   <Input label="Start Time" type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                   <Input label="End Time" type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                   <Input label="Expenses (₹)" type="number" placeholder="Daily ritual cost" value={formData.expenses} onChange={e => setFormData({...formData, expenses: e.target.value})} />
                   <Input label="Setup Particulars" placeholder="e.g. 50 Lotus, Ghee..." value={formData.mandapDetails} onChange={e => setFormData({...formData, mandapDetails: e.target.value})} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="lg" className="px-12 h-12 bg-amber-600 hover:bg-amber-700 shadow-amber-200">Save Schedule</Button>
                </div>
             </form>
          </Card>
        )}

        <div className="space-y-6">
           {loading ? (
             <div className="py-12 text-center text-gray-400">Loading rituals...</div>
           ) : schedules.length > 0 ? (
             schedules.map(schedule => (
               <Card key={schedule.id} className="p-0 border-amber-50 group hover:border-amber-200 transition-all overflow-hidden">
                  <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-50">
                     <div className="md:w-32 p-6 flex flex-col items-center justify-center bg-amber-50/50 group-hover:bg-amber-50 transition-colors">
                        <span className="text-[10px] uppercase font-black text-amber-600 tracking-widest mb-1">Day</span>
                        <span className="text-4xl font-black text-amber-600">{schedule.day}</span>
                     </div>
                     
                     <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-white border border-amber-100 flex items-center justify-center shadow-sm">
                              <Flower2 className="w-6 h-6 text-amber-500" />
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <h4 className="font-black text-xl text-gray-900 leading-tight">{schedule.tithi}</h4>
                                 {schedule.expenses > 0 && (
                                   <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded-md">
                                      <IndianRupee className="w-3 h-3" /> {schedule.expenses.toLocaleString()}
                                   </div>
                                 )}
                              </div>
                              <p className="text-gray-500 font-bold text-sm">{schedule.pujaName}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs font-medium text-gray-400">
                                 <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {schedule.startTime} - {schedule.endTime}
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {format(new Date(schedule.date), 'dd MMM yyyy')}
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-gray-50/50 p-4 rounded-2xl md:max-w-xs w-full text-xs font-medium text-gray-500 leading-relaxed border border-gray-100">
                           <div className="flex items-center gap-1 text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">
                             <Bookmark className="w-3 h-3" /> Particulars
                           </div>
                           {schedule.mandapDetails || 'No ritual particulars specified'}
                        </div>
                     </div>
                  </div>
               </Card>
             ))
           ) : (
             <div className="py-20 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-amber-200">
                Puja schedule is blank. <br/> Start mapping your rituals!
             </div>
           )}
        </div>
      </div>
    </Layout>
  );
}
