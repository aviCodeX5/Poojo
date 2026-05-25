import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ROLES, ROLE_COLORS } from '../constants';
import { UserRole, Member } from '../types';
import { motion } from 'motion/react';
import { UserPlus, MoreVertical, Trash2, Edit2, Shield, Phone, Copy, MessageSquare, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Members() {
  const { committee, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    address: '',
    role: 'MEMBER' as UserRole
  });

  const fetchMembers = async () => {
    if (!committee) return;
    setLoading(true);
    try {
      const id = committee.id || committee.committeeId;
      const snap = await getDocs(collection(db, 'committees', id, 'members'));
      setMembers(snap.docs.map(d => d.data() as Member));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [committee]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committee || !user) return;
    
    // Validate phone number (10 digits)
    const phoneDigits = newMember.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    
    try {
      const id = committee.id || committee.committeeId;
      const phone = newMember.phone.startsWith('+91') ? newMember.phone : `+91${newMember.phone}`;
      
      // Check if member with this phone number already exists
      const memberRef = doc(db, 'committees', id, 'members', phone);
      const existingMember = await getDoc(memberRef);
      
      if (existingMember.exists()) {
        alert('A member with this phone number already exists!');
        return;
      }
      
      const memberData: Member = {
        memberId: phone,
        name: newMember.name,
        phone: phone,
        role: newMember.role,
        addedAt: new Date().toISOString(),
        addedBy: user.uid,
        isActive: true,
        address: newMember.address
      };

      await setDoc(memberRef, memberData);
      setNewMember({ name: '', phone: '', address: '', role: 'MEMBER' });
      setIsAdding(false);
      fetchMembers();
      alert('Member added successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!committee || !window.confirm('Are you sure you want to remove this member?')) return;
    try {
      const id = committee.id || committee.committeeId;
      await deleteDoc(doc(db, 'committees', id, 'members', memberId));
      fetchMembers();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getWhatsAppLink = (m: Member) => {
    const text = `You have been added to ${committee?.name} on PujaCommittee. Login using your mobile number: ${m.phone} at ${window.location.origin}/member-login`;
    return `https://wa.me/${m.phone.replace('+', '')}?text=${encodeURIComponent(text)}`;
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Member Management</h1>
            <p className="text-gray-500 font-medium font-sans">Manage your committee hierarchy and access</p>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)} className="h-12 shadow-md">
            {isAdding ? 'Cancel' : <><UserPlus className="w-5 h-5 mr-2" /> Add New Member</>}
          </Button>
        </header>

        {isAdding && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2 border-primary/20 bg-orange-50/30">
              <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <Input 
                  label="Name" 
                  placeholder="John Doe" 
                  value={newMember.name} 
                  onChange={e => setNewMember({...newMember, name: e.target.value})}
                  required
                />
                <Input 
                  label="Phone Number" 
                  placeholder="9876543210" 
                  value={newMember.phone}
                  onChange={e => setNewMember({...newMember, phone: e.target.value})}
                  required
                />
                <Input 
                  label="Address" 
                  placeholder="123, Street Name, City" 
                  value={newMember.address}
                  onChange={e => setNewMember({...newMember, address: e.target.value})}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">Assign Role</label>
                  <select 
                    value={newMember.role}
                    onChange={e => setNewMember({...newMember, role: e.target.value as UserRole})}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  >
                    {ROLES.filter(r => r !== 'ADMIN').map(r => (
                      <option key={r} value={r}>{r.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="h-12 md:col-span-2 lg:col-span-4">Submit Member</Button>
              </form>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-40 rounded-3xl bg-gray-100 animate-pulse" />
             ))
          ) : members.length > 0 ? (
            members.sort((a,b) => a.role === 'ADMIN' ? -1 : 1).map((m) => (
              <Card key={m.memberId} className="relative group hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md", ROLE_COLORS[m.role as UserRole])}>
                       {m.role === 'ADMIN' ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-none mb-1">{m.name}</h4>
                      <div className="flex items-center gap-1 text-gray-400 text-xs font-medium uppercase tracking-tight">
                        <Phone className="w-3 h-3" /> {m.phone}
                      </div>
                    </div>
                  </div>
                  {m.role !== 'ADMIN' && (
                    <button onClick={() => deleteMember(m.memberId)} className="text-gray-300 hover:text-red-500 transition-colors">
                       <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between mt-6">
                   <span className={cn(
                     "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white",
                     ROLE_COLORS[m.role as UserRole]
                   )}>
                     {m.role.replace('_', ' ')}
                   </span>
                   
                   <div className="flex gap-2">
                      <a href={getWhatsAppLink(m)} target="_blank" rel="noreferrer" className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </a>
                   </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-400 font-medium">
              No members found. Start by adding your committee members.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
