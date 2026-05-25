import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { db, storage } from '../firebase';
import { collection, query, getDocs, addDoc, orderBy, where, setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Expense, ExpenseCategory, CustomCategory } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';
import { Plus, Receipt, ShoppingCart, Tag, User, Camera, Calendar, Upload, X, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Expenses() {
  const { committee, member, isAdminAccount, currentEdition } = useAuth();
  const { role, hasModuleAccess } = usePermissions();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [billPhotoURL, setBillPhotoURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [allCategories, setAllCategories] = useState<string[]>(EXPENSE_CATEGORIES);

  // Determine allowed categories for the current role
  const getRoleCategory = (): ExpenseCategory | 'all' => {
    if (role === 'LIGHT_INCHARGE') return 'Lighting';
    if (role === 'PANDAL_INCHARGE') return 'Pandal';
    if (role === 'VISARJAN_INCHARGE') return 'Visarjan';
    if (role === 'MANDAP_INCHARGE') return 'Mandap';
    if (role === 'CULTURAL_INCHARGE') return 'Cultural';
    return 'all';
  };

  const allowedCategory = getRoleCategory();

  const [formData, setFormData] = useState({
    category: (allowedCategory === 'all' ? 'Miscellaneous' : allowedCategory) as ExpenseCategory,
    amount: '',
    reason: '',
    vendorName: '',
    dependentMemberName: ''
  });

  const handleFileUpload = async (file: File) => {
    if (!committee) return;
    setUploading(true);
    try {
      const id = committee.id || committee.committeeId;
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `committees/${id}/bills/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setBillPhotoURL(downloadURL);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload bill photo');
    } finally {
      setUploading(false);
    }
  };

  const fetchExpenses = async () => {
    if (!committee) return;
    setLoading(true);
    try {
      const id = committee.id || committee.committeeId;
      const q = query(collection(db, 'committees', id, 'expenses'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      let allExpenses = snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
      
      // Filter based on role if necessary for view-level scoping
      // Based on PRD, everyone can VIEW all expenses, but only certain roles can FEED specific ones.
      setExpenses(allExpenses);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomCategories = async () => {
    if (!committee) return;
    try {
      const id = committee.id || committee.committeeId;
      const q = query(collection(db, 'committees', id, 'customCategories'));
      const snap = await getDocs(q);
      const categories = snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomCategory));
      setCustomCategories(categories);
      
      // Combine default categories with custom categories
      const categoryNames = categories.map(c => c.name);
      setAllCategories([...EXPENSE_CATEGORIES, ...categoryNames]);
    } catch (error) {
      console.error('Error fetching custom categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!committee || !newCategoryName.trim()) return;
    try {
      const id = committee.id || committee.committeeId;
      const categoryRef = doc(collection(db, 'committees', id, 'customCategories'));
      await setDoc(categoryRef, {
        name: newCategoryName.trim(),
        createdAt: new Date().toISOString(),
        createdBy: member?.memberId || 'ADMIN'
      });
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      fetchCustomCategories();
      alert('Category created successfully');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchCustomCategories();
  }, [committee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committee) return;

    try {
      const id = committee.id || committee.committeeId;
      const expenseData: any = {
        category: formData.category,
        amount: Number(formData.amount),
        reason: formData.reason,
        vendorName: formData.vendorName,
        date: new Date().toISOString(),
        year: currentEdition?.year || new Date().getFullYear(),
        editionId: currentEdition?.id,
        enteredBy: member?.memberId || 'ADMIN',
        enteredByRole: role,
        dependentMemberName: role === 'CASHIER' ? formData.dependentMemberName : undefined
      };
      
      if (billPhotoURL) {
        expenseData.billPhotoURL = billPhotoURL;
      }

      await addDoc(collection(db, 'committees', id, 'expenses'), expenseData);
      setFormData({
        category: (allowedCategory === 'all' ? 'Miscellaneous' : allowedCategory) as ExpenseCategory,
        amount: '',
        reason: '',
        vendorName: '',
        dependentMemberName: ''
      });
      setBillPhotoURL(null);
      setIsAdding(false);
      fetchExpenses();
      alert('Expense recorded successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Expense Ledger</h1>
            <p className="text-gray-500 font-medium font-sans">Track and verify committee spending</p>
          </div>
          {hasModuleAccess('expenses') && (
            <Button onClick={() => setIsAdding(!isAdding)} className="h-12">
               {isAdding ? 'Cancel' : <><Plus className="w-5 h-5 mr-2" /> Record Expense</>}
            </Button>
          )}
        </header>

        {isAdding && (
          <Card className="border-2 border-primary/20 bg-orange-50/20">
             <h3 className="font-bold mb-4">Add Expense Entry</h3>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 ml-1">Category</label>
                      <select
                        disabled={allowedCategory !== 'all'}
                        value={formData.category}
                        onChange={e => {
                          if (e.target.value === '__CREATE_NEW__') {
                            setShowNewCategoryInput(true);
                          } else {
                            setFormData({...formData, category: e.target.value});
                          }
                        }}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all disabled:opacity-50"
                      >
                         {allCategories.map(cat => (
                            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                         ))}
                         <option value="__CREATE_NEW__">+ Create New Category</option>
                      </select>
                      {showNewCategoryInput && (
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="New category name"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            className="flex-1"
                          />
                          <Button type="button" onClick={handleCreateCategory} size="sm">
                            <PlusCircle className="w-4 h-4" />
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setShowNewCategoryInput(false)} size="sm">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                   </div>
                   <Input label="Amount (₹)" type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                   <Input label="Reason / Particulars" required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                   <Input label="Vendor Name" required value={formData.vendorName} onChange={e => setFormData({...formData, vendorName: e.target.value})} />
                   {role === 'CASHIER' && (
                     <Input label="Dependent Member Name" value={formData.dependentMemberName} onChange={e => setFormData({...formData, dependentMemberName: e.target.value})} />
                   )}
                   <div className="flex items-end gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file);
                          }
                        }}
                        accept="image/*"
                        className="hidden"
                      />
                      {billPhotoURL ? (
                        <div className="flex-1 relative">
                          <img src={billPhotoURL} alt="Bill" className="w-full h-12 object-cover rounded-xl border-2 border-green-500" />
                          <button
                            type="button"
                            onClick={() => {
                              setBillPhotoURL(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex-1 h-12 border-dashed font-bold border-2"
                        >
                          {uploading ? (
                            <>Uploading...</>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 mr-2" /> Upload Bill Photo
                            </>
                          )}
                        </Button>
                      )}
                   </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="lg" className="px-12 h-12">Submit Entry</Button>
                </div>
             </form>
          </Card>
        )}

        <div className="space-y-4">
           {loading ? (
             <div className="text-center py-12 text-gray-400">Loading expenses...</div>
           ) : expenses.length > 0 ? (
             expenses.map(ex => (
               <Card key={ex.id} className="p-0 border-orange-50 hover:border-accent/10 transition-all">
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-accent flex items-center justify-center">
                           <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                           <h4 className="font-bold text-lg text-gray-900 leading-tight">{ex.reason}</h4>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-orange-100 text-primary text-[10px] font-black uppercase rounded-md tracking-tight">
                                 {ex.category.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-400 font-medium font-sans">
                                 {format(new Date(ex.date), 'dd MMM yyyy')} • By {ex.enteredByRole}
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center justify-between md:justify-end gap-12">
                        <div className="text-right">
                           <p className="text-2xl font-black text-accent tracking-tighter">₹{ex.amount.toLocaleString()}</p>
                           <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">Vendor: {ex.vendorName}</p>
                        </div>
                        
                        <div className="flex gap-2">
                           {ex.dependentMemberName && (
                              <div title={`Dependent: ${ex.dependentMemberName}`} className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                 <User className="w-5 h-5" />
                              </div>
                           )}
                           <button className="p-3 bg-white border border-gray-200 text-gray-400 rounded-xl hover:text-accent hover:border-accent transition-all group">
                              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                           </button>
                        </div>
                     </div>
                  </div>
               </Card>
             ))
           ) : (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 font-medium">
                No expense records found for this committee.
             </div>
           )}
        </div>
      </div>
    </Layout>
  );
}
