import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { Donation, DonationType } from '../types';
import { Plus, Download, Share2, DollarSign, Gift, CreditCard, Landmark, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { generateReceiptNumber } from '../utils/idGenerator';
import { generateDonationReceipt } from '../utils/receiptGenerator';
import { cn } from '../lib/utils';

export default function Donations() {
  const { committee, member, currentEdition } = useAuth();
  const { hasModuleAccess } = usePermissions();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    donorName: '',
    donorPhone: '',
    amount: '',
    donationType: 'Cash' as DonationType,
    kindDescription: '',
    estimatedValue: ''
  });

  const fetchDonations = async () => {
    if (!committee) return;
    setLoading(true);
    try {
      const id = committee.id || committee.committeeId;
      const q = query(collection(db, 'committees', id, 'donations'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [committee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committee) return;

    try {
      const id = committee.id || committee.committeeId;
      const year = new Date().getFullYear();
      const sequence = donations.length + 1;
      const receiptNo = generateReceiptNumber(id, year, 'DON', sequence);

      const donationData: Omit<Donation, 'id'> = {
        donorName: formData.donorName,
        donorPhone: formData.donorPhone,
        amount: Number(formData.amount),
        donationType: formData.donationType,
        kindDescription: formData.kindDescription,
        estimatedValue: Number(formData.estimatedValue),
        date: new Date().toISOString(),
        year: currentEdition?.year || year,
        editionId: currentEdition?.id,
        enteredBy: member?.memberId || 'ADMIN',
        receiptNumber: receiptNo,
        receiptSent: false
      };

      await addDoc(collection(db, 'committees', id, 'donations'), donationData);
      setFormData({ donorName: '', donorPhone: '', amount: '', donationType: 'Cash', kindDescription: '', estimatedValue: '' });
      setIsAdding(false);
      fetchDonations();
      alert('Donation entry added!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const downloadReceipt = (donation: Donation) => {
    const docPdf = generateDonationReceipt({
      committeeName: committee?.name || 'Committee',
      donorName: donation.donorName,
      donorPhone: donation.donorPhone,
      amount: donation.amount,
      receiptNumber: donation.receiptNumber,
      date: donation.date,
      pujaType: committee?.pujaType || 'Puja',
      year: donation.year,
      collectedBy: donation.enteredBy
    });
    docPdf.save(`Donation-${donation.receiptNumber.replace(/\//g, '-')}.pdf`);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Donations & Sporsors</h1>
            <p className="text-gray-500 font-medium font-sans">Track large contributions and sponsorships</p>
          </div>
          {hasModuleAccess('donations') && (
            <Button onClick={() => setIsAdding(!isAdding)} className="h-12">
               {isAdding ? 'Cancel' : <><Plus className="w-5 h-5 mr-2" /> Add Donation</>}
            </Button>
          )}
        </header>

        {isAdding && (
          <Card className="border-2 border-primary/20 bg-orange-50/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Input label="Donor Name" required value={formData.donorName} onChange={e => setFormData({...formData, donorName: e.target.value})} />
                <Input label="Donor Phone" required value={formData.donorPhone} onChange={e => setFormData({...formData, donorPhone: e.target.value})} />
                <div className="space-y-1.5">
                   <label className="text-sm font-medium text-gray-700 ml-1">Donation Type</label>
                   <select 
                     value={formData.donationType}
                     onChange={e => setFormData({...formData, donationType: e.target.value as DonationType})}
                     className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                   >
                     <option value="Cash">Cash</option>
                     <option value="UPI">UPI</option>
                     <option value="Cheque">Cheque</option>
                     <option value="Kind">Kind (Goods)</option>
                     <option value="Sponsor">Sponsorship</option>
                   </select>
                </div>
                <Input label="Amount (₹)" type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                {formData.donationType === 'Kind' && (
                  <>
                    <Input label="Goods Description" placeholder="e.g. 50kg Rice" value={formData.kindDescription} onChange={e => setFormData({...formData, kindDescription: e.target.value})} />
                    <Input label="Estimated Value (₹)" type="number" value={formData.estimatedValue} onChange={e => setFormData({...formData, estimatedValue: e.target.value})} />
                  </>
                )}
              </div>
              <div className="flex justify-end">
                 <Button type="submit" size="lg" className="px-12 h-12">Save Donation</Button>
              </div>
            </form>
          </Card>
        )}

        <div className="space-y-4">
           {loading ? (
             <div className="text-center py-12 text-gray-400">Loading donations...</div>
           ) : donations.length > 0 ? (
             donations.map(donation => (
               <Card key={donation.id} className="p-0 border-orange-50 hover:border-primary/20 transition-all">
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                          donation.donationType === 'Cash' ? 'bg-green-50 text-green-600' :
                          donation.donationType === 'Sponsor' ? 'bg-purple-50 text-purple-600' :
                          'bg-blue-50 text-blue-600'
                        )}>
                           {donation.donationType === 'Cash' && <DollarSign className="w-6 h-6" />}
                           {donation.donationType === 'UPI' && <CreditCard className="w-6 h-6" />}
                           {donation.donationType === 'Sponsor' && <Landmark className="w-6 h-6" />}
                           {donation.donationType === 'Kind' && <Gift className="w-6 h-6" />}
                           {donation.donationType === 'Cheque' && <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                           <h4 className="font-bold text-lg text-gray-900 leading-tight">{donation.donorName}</h4>
                           <p className="text-xs text-gray-400 font-medium">
                              {format(new Date(donation.date), 'dd MMM yyyy')} • {donation.donationType}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center justify-between md:justify-end gap-8">
                        <div className="text-right">
                           <p className="text-2xl font-black text-gray-900 leading-none">₹{donation.amount.toLocaleString()}</p>
                           {donation.donationType === 'Kind' && (
                             <p className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]">{donation.kindDescription}</p>
                           )}
                        </div>
                        
                        <div className="flex gap-2">
                           <button onClick={() => downloadReceipt(donation)} className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
                              <Download className="w-5 h-5" />
                           </button>
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
                No donation records found.
             </div>
           )}
        </div>
      </div>
    </Layout>
  );
}
