import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, addDoc, where } from 'firebase/firestore';
import { ChandaEntry } from '../types';
import { Plus, Check, X, FileText, Download, Share2, History, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { generateReceiptNumber } from '../utils/idGenerator';
import { generateDonationReceipt } from '../utils/receiptGenerator';
import { exportChandaToExcel } from '../utils/excelExport';

export default function Chanda() {
  const { committee, member, isAdminAccount, currentEdition } = useAuth();
  const { role, canApprove, hasModuleAccess } = usePermissions();
  const [entries, setEntries] = useState<ChandaEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [loading, setLoading] = useState(true);

  // Form for new entry
  const [formData, setFormData] = useState({
    donorName: '',
    donorPhone: '',
    donorAddress: '',
    amount: '',
    notes: ''
  });

  const fetchEntries = async () => {
    if (!committee) return;
    setLoading(true);
    try {
      const id = committee.id || committee.committeeId;
      const snap = await getDocs(collection(db, 'committees', id, 'chandaEntries'));
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChandaEntry)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [committee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committee) return;

    try {
      const id = committee.id || committee.committeeId;
      const year = new Date().getFullYear();
      const status = (role === 'CHANDA_INCHARGE' || role === 'SECRETARY' || isAdminAccount) ? 'Approved' : 'Pending';
      
      // Get sequence for receipt number (in a real app, this should be a server atomic counter)
      const sequence = entries.length + 1;
      const receiptNo = generateReceiptNumber(id, year, 'CHANDA', sequence);

      const entryData: Omit<ChandaEntry, 'id'> = {
        donorName: formData.donorName,
        donorPhone: formData.donorPhone,
        donorAddress: formData.donorAddress,
        amount: Number(formData.amount),
        collectedBy: member?.memberId || 'ADMIN',
        date: new Date().toISOString(),
        year: currentEdition?.year || year,
        status,
        receiptNumber: receiptNo,
        notes: formData.notes
      };

      if (currentEdition?.id) {
        entryData.editionId = currentEdition.id;
      }

      if (status === 'Approved') {
        entryData.approvedBy = member?.memberId || 'ADMIN';
        entryData.approvedAt = new Date().toISOString();
      }

      await addDoc(collection(db, 'committees', id, 'chandaEntries'), entryData);
      setFormData({ donorName: '', donorPhone: '', donorAddress: '', amount: '', notes: '' });
      setIsAdding(false);
      fetchEntries();
      alert(status === 'Approved' ? 'Chanda entry recorded and approved!' : 'Entry submitted for approval.');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleApprove = async (entryId: string) => {
    if (!committee) return;
    try {
      const id = committee.id || committee.committeeId;
      const entryRef = doc(db, 'committees', id, 'chandaEntries', entryId);
      await updateDoc(entryRef, {
        status: 'Approved',
        approvedBy: member?.memberId || 'ADMIN',
        approvedAt: new Date().toISOString()
      });
      fetchEntries();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const downloadReceipt = (entry: ChandaEntry) => {
    const docPdf = generateDonationReceipt({
      committeeName: committee?.name || 'Committee',
      donorName: entry.donorName,
      donorPhone: entry.donorPhone,
      amount: entry.amount,
      receiptNumber: entry.receiptNumber,
      date: entry.date,
      pujaType: committee?.pujaType || 'Puja',
      year: entry.year,
      collectedBy: entry.collectedBy
    });
    docPdf.save(`Receipt-${entry.receiptNumber.replace(/\//g, '-')}.pdf`);
  };

  const exportToExcel = () => {
    try {
      exportChandaToExcel(entries, committee?.name || 'Committee');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data to Excel. Please try again.');
    }
  };

  const filteredEntries = entries.filter(e => e.status.toLowerCase() === activeTab);

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Chanda Ledger</h1>
            <p className="text-gray-500 font-medium">Record and manage contribution subscriptions</p>
          </div>
          {hasModuleAccess('chanda') && (
            <div className="flex gap-2">
              <Button onClick={() => setIsAdding(!isAdding)} className="h-12">
                 {isAdding ? 'Cancel' : <><Plus className="w-5 h-5 mr-2" /> Record Collection</>}
              </Button>
              {entries.length > 0 && (
                <Button variant="outline" onClick={exportToExcel} className="h-12">
                   <Download className="w-5 h-5 mr-2" /> Export Excel
                </Button>
              )}
            </div>
          )}
        </header>

        {isAdding && (
          <Card className="border-2 border-primary/20 bg-orange-50/20">
            <h3 className="font-bold mb-4">New Chanda Entry</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Input label="Donor Name" required value={formData.donorName} onChange={e => setFormData({...formData, donorName: e.target.value})} />
              <Input label="Donor Phone" required value={formData.donorPhone} onChange={e => setFormData({...formData, donorPhone: e.target.value})} />
              <Input label="Address" value={formData.donorAddress} onChange={e => setFormData({...formData, donorAddress: e.target.value})} />
              <Input label="Amount (₹)" type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              <Input label="Notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              <div className="flex items-end">
                 <Button type="submit" className="w-full h-12">Save Entry</Button>
              </div>
            </form>
          </Card>
        )}

        <div className="space-y-6">
           <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
              <button 
                onClick={() => setActiveTab('approved')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'approved' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
              >
                <div className="flex items-center gap-2">
                   <History className="w-4 h-4" /> Approved Ledger
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'}`}
              >
                <div className="flex items-center gap-2">
                   <Clock className="w-4 h-4" /> Pending ({entries.filter(e => e.status === 'Pending').length})
                </div>
              </button>
           </div>

           <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-gray-400">Loading entries...</div>
              ) : filteredEntries.length > 0 ? (
                filteredEntries.map(entry => (
                  <Card key={entry.id} className="p-0 border-orange-50 hover:border-primary/20 transition-colors">
                     <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${entry.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                              <Landmark className={cn("w-6 h-6", entry.status === 'Approved' ? 'text-green-600' : 'text-orange-600')} />
                           </div>
                           <div>
                              <h4 className="font-bold text-lg text-gray-900 leading-tight">{entry.donorName}</h4>
                              <p className="text-xs text-gray-400 font-medium">
                                 {format(new Date(entry.date), 'dd MMM yyyy, hh:mm a')} • collected by {entry.collectedBy}
                              </p>
                           </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-8">
                           <div className="text-right">
                              <p className="text-2xl font-black text-gray-900 leading-none">₹{entry.amount.toLocaleString()}</p>
                              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">{entry.receiptNumber}</p>
                           </div>
                           
                           <div className="flex gap-2">
                              {entry.status === 'Pending' && canApprove && (
                                 <button onClick={() => handleApprove(entry.id!)} className="p-3 bg-green-600 text-white rounded-xl shadow-lg shadow-green-200">
                                    <Check className="w-5 h-5" />
                                 </button>
                              )}
                              {entry.status === 'Approved' && (
                                 <button onClick={() => downloadReceipt(entry)} className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
                                    <Download className="w-5 h-5" />
                                 </button>
                              )}
                              <button className="p-3 bg-white border border-gray-200 text-gray-400 rounded-xl hover:text-primary transition-colors">
                                 <Share2 className="w-5 h-5" />
                              </button>
                           </div>
                        </div>
                     </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 font-medium">
                   No {activeTab} entries found.
                </div>
              )}
           </div>
        </div>
      </div>
    </Layout>
  );
}

function Landmark({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" y1="21" x2="21" y2="21"></line><line x1="3" y1="7" x2="21" y2="7"></line><polyline points="3 7 12 2 21 7"></polyline><line x1="5" y1="21" x2="5" y2="7"></line><line x1="9" y1="21" x2="9" y2="7"></line><line x1="15" y1="21" x2="15" y2="7"></line><line x1="19" y1="21" x2="19" y2="7"></line></svg>
  );
}
