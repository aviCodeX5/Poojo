import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { CulturalEvent } from '../types';
import { Music, Plus, Users, Clock, Calendar, MessageSquare, Mic2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Cultural() {
  const { committee, member } = useAuth();
  const { role, hasModuleAccess } = usePermissions();
  const [events, setEvents] = useState<CulturalEvent[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    eventName: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '18:00',
    endTime: '21:00',
    performerDetails: '',
    participants: ''
  });

  const fetchEvents = async () => {
    if (!committee) return;
    setLoading(true);
    try {
      const id = committee.id || committee.committeeId;
      const q = query(collection(db, 'committees', id, 'culturalEvents'), orderBy('date', 'asc'));
      const snap = await getDocs(q);
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CulturalEvent)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [committee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committee) return;

    try {
      const id = committee.id || committee.committeeId;
      const eventData: Omit<CulturalEvent, 'id'> = {
        eventName: formData.eventName,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        performerDetails: formData.performerDetails,
        participants: formData.participants.split(',').map(s => s.trim()).filter(s => s),
        broadcastSent: false,
        enteredBy: member?.memberId || 'ADMIN'
      };

      await addDoc(collection(db, 'committees', id, 'culturalEvents'), eventData);
      setFormData({
        eventName: '', 
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '18:00',
        endTime: '21:00',
        performerDetails: '',
        participants: ''
      });
      setIsAdding(false);
      fetchEvents();
      alert('Cultural event added to schedule!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight text-pink-600">Cultural Programme</h1>
            <p className="text-gray-500 font-medium font-sans">Manage events, performers, and broadcast schedules</p>
          </div>
          {hasModuleAccess('culturalEvents') && (
            <Button onClick={() => setIsAdding(!isAdding)} className="h-12 bg-pink-600 hover:bg-pink-700 shadow-pink-200">
               {isAdding ? 'Cancel' : <><Plus className="w-5 h-5 mr-2" /> Add Event</>}
            </Button>
          )}
        </header>

        {isAdding && (
          <Card className="border-2 border-pink-100 bg-pink-50/20">
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <Input label="Event Name" required value={formData.eventName} onChange={e => setFormData({...formData, eventName: e.target.value})} />
                   <Input label="Date" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                   <div className="grid grid-cols-2 gap-4">
                      <Input label="Start Time" type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                      <Input label="End Time" type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                   </div>
                   <Input label="Performers / Artists" value={formData.performerDetails} onChange={e => setFormData({...formData, performerDetails: e.target.value})} />
                   <Input label="Participant Names (comma separated)" value={formData.participants} onChange={e => setFormData({...formData, participants: e.target.value})} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="lg" className="px-12 h-12 bg-pink-600 hover:bg-pink-700 shadow-pink-200">Save Event</Button>
                </div>
             </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {loading ? (
             <div className="col-span-full py-12 text-center text-gray-400">Loading events...</div>
           ) : events.length > 0 ? (
             events.map(event => (
               <Card key={event.id} className="relative group overflow-hidden border-pink-50 hover:border-pink-200 transition-all">
                  <div className="absolute top-0 right-0 p-3 bg-pink-50 rounded-bl-3xl">
                     <Music className="w-5 h-5 text-pink-500" />
                  </div>
                  
                  <div className="mb-6">
                     <h4 className="font-bold text-xl text-gray-900 leading-tight mb-2 pr-6">{event.eventName}</h4>
                     <div className="flex items-center gap-2 text-pink-600 font-bold text-xs uppercase tracking-widest bg-pink-50 w-fit px-2 py-1 rounded-md">
                        <Calendar className="w-3 h-3" /> {format(new Date(event.date), 'EEEE, dd MMM')}
                     </div>
                  </div>

                  <div className="space-y-4 mb-8">
                     <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{event.startTime} - {event.endTime}</span>
                     </div>
                     <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Mic2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{event.performerDetails || 'No details specified'}</span>
                     </div>
                     {event.participants.length > 0 && (
                        <div className="flex items-start gap-4">
                           <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                           <div className="flex flex-wrap gap-1.5">
                              {event.participants.slice(0, 3).map((p, i) => (
                                 <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500">{p}</span>
                              ))}
                              {event.participants.length > 3 && <span className="text-[10px] text-gray-400 font-bold">+{event.participants.length - 3} more</span>}
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="flex gap-2">
                     <Button variant="outline" size="sm" className="flex-1 rounded-xl h-10 text-xs border-pink-200 text-pink-600 hover:bg-pink-50 shadow-none">
                        Edit Schedule
                     </Button>
                     <Button size="sm" className="aspect-square p-0 w-10 h-10 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 shadow-none">
                        <MessageSquare className="w-4 h-4" />
                     </Button>
                  </div>
               </Card>
             ))
           ) : (
             <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-pink-200">
                The cultural stage is quiet. <br/> Add your first event to the schedule!
             </div>
           )}
        </div>
      </div>
    </Layout>
  );
}
