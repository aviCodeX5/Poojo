import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { apiCreate, apiList } from '../lib/api';
import { Broadcast, BroadcastType, UserRole } from '../types';
import { ROLES } from '../constants';
import { MessageSquare, Send, Bell, Users, History, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Broadcasts() {
  const { committee, member, isAdminAccount } = useAuth();
  const { role, canBroadcast } = usePermissions();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    message: '',
    type: 'General' as BroadcastType,
    targetRoles: 'all' as string[] | 'all'
  });

  const fetchBroadcasts = async () => {
    if (!committee) return;
    setLoading(true);
    try {
      const id = committee.id || committee.committeeId;
      const records = await apiList<Broadcast>(id, 'broadcasts');
      setBroadcasts(records.sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt))));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, [committee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committee) return;

    try {
      const id = committee.id || committee.committeeId;
      const broadcastData: Omit<Broadcast, 'id'> = {
        message: formData.message,
        sentBy: member?.memberId || 'ADMIN', // ADMIN email auth has no memberId field technically in hook, but logic handles it
        sentByRole: role,
        targetRoles: formData.targetRoles,
        sentAt: new Date().toISOString(),
        type: formData.type
      };

      await apiCreate<Broadcast>(id, 'broadcasts', broadcastData);
      setFormData({ message: '', type: 'General', targetRoles: 'all' });
      setIsAdding(false);
      fetchBroadcasts();
      alert('Broadcast message sent to all active members!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Broadcast Center</h1>
            <p className="text-gray-500 font-medium font-sans">Communicate with your committee at scale</p>
          </div>
          {canBroadcast && (
            <Button onClick={() => setIsAdding(!isAdding)} className="h-12">
               {isAdding ? 'Cancel' : <><Send className="w-5 h-5 mr-2" /> New Broadcast</>}
            </Button>
          )}
        </header>

        {isAdding && (
          <Card className="border-2 border-primary/20 bg-orange-50/20">
             <h3 className="font-bold mb-4">Compose Broadcast Message</h3>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 ml-1">Message Content</label>
                      <textarea 
                        required
                        rows={4}
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-gray-400"
                        placeholder="Type your announcement here..."
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 ml-1">Broadcast Type</label>
                      <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as BroadcastType})}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      >
                         <option value="General">General Announcement</option>
                         <option value="Chanda_Report">Chanda Collection Report</option>
                         <option value="Donation_Receipt">Donation Update</option>
                         <option value="Cultural_Schedule">Cultural Schedule</option>
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 ml-1">Target Audience</label>
                      <select 
                        value={Array.isArray(formData.targetRoles) ? 'specific' : 'all'}
                        onChange={e => setFormData({...formData, targetRoles: e.target.value === 'all' ? 'all' : []})}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      >
                         <option value="all">All Committee Members</option>
                         <option value="specific">Specific Roles Only</option>
                      </select>
                   </div>
                </div>
                
                {Array.isArray(formData.targetRoles) && (
                   <div className="flex flex-wrap gap-2">
                      {ROLES.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            const current = formData.targetRoles as string[];
                            if (current.includes(r)) {
                               setFormData({...formData, targetRoles: current.filter(cr => cr !== r)});
                            } else {
                               setFormData({...formData, targetRoles: [...current, r]});
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                            (formData.targetRoles as string[]).includes(r) 
                              ? "bg-primary border-primary text-white" 
                              : "border-gray-200 text-gray-400 bg-white"
                          )}
                        >
                          {r.replace('_', ' ')}
                        </button>
                      ))}
                   </div>
                )}

                <div className="flex justify-end gap-4">
                  <Button type="submit" size="lg" className="px-12 h-12 shadow-lg shadow-primary/30">
                    Send Broadcast Now
                  </Button>
                </div>
             </form>
          </Card>
        )}

        <div className="space-y-6">
           <h3 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" /> Past Broadcasts
           </h3>
           
           <div className="space-y-4">
              {loading ? (
                <div className="py-12 text-center text-gray-400">Loading broadcast logs...</div>
              ) : broadcasts.length > 0 ? (
                broadcasts.map(log => (
                  <Card key={log.id} className="p-0 border-orange-50 hover:border-primary/10 transition-all overflow-hidden">
                     <div className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-gray-50">
                           <div className="flex items-center gap-3">
                              <div className={cn(
                                 "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                 log.type === 'Chanda_Report' ? 'bg-blue-50 text-blue-600' :
                                 log.type === 'Cultural_Schedule' ? 'bg-pink-50 text-pink-600' :
                                 'bg-orange-50 text-primary'
                              )}>
                                 {log.type === 'Cultural_Schedule' ? <Bell className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                              </div>
                              <div>
                                 <h4 className="font-bold text-sm text-gray-900 leading-none mb-1">{log.type.replace('_', ' ')}</h4>
                                 <p className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">
                                    {format(new Date(log.sentAt), 'dd MMM yyyy, hh:mm a')} • By {log.sentByRole}
                                 </p>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest bg-gray-100 px-2 py-1 rounded">
                                 {log.targetRoles === 'all' ? 'All Members' : `${log.targetRoles.length} Roles`}
                              </span>
                           </div>
                        </div>
                        
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                           {log.message}
                        </p>
                        
                        <div className="mt-6 flex justify-end gap-2">
                           <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-400 hover:text-primary transition-colors">
                              <Share2 className="w-4 h-4" /> Share to WhatsApp
                           </button>
                        </div>
                     </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                   <div className="text-gray-400 font-medium">Broadcast logs are empty.</div>
                </div>
              )}
           </div>
        </div>
      </div>
    </Layout>
  );
}
