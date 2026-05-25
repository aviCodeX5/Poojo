import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, orderBy, where } from 'firebase/firestore';
import { InventoryItem, InventoryModule } from '../types';
import { Box, Plus, TrendingUp, ShoppingBag, Package, Truck, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Inventory() {
  const { committee, member } = useAuth();
  const { role, hasModuleAccess } = usePermissions();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activeModule, setActiveModule] = useState<InventoryModule>('Lighting');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine which module this user can edit
  const getRoleModule = (): InventoryModule | 'all' => {
    if (role === 'LIGHT_INCHARGE') return 'Lighting';
    if (role === 'PANDAL_INCHARGE') return 'Pandal';
    if (role === 'VISARJAN_INCHARGE') return 'Visarjan';
    if (role === 'MANDAP_INCHARGE') return 'Mandap';
    // Bhog might be handled by others
    return 'all';
  };

  const allowedModule = getRoleModule();

  const [formData, setFormData] = useState({
    itemName: '',
    unit: '',
    vendorName: '',
    quantityPurchased: '',
    quantityUsed: '',
    pricePerUnit: ''
  });

  const fetchInventory = async () => {
    if (!committee) return;
    setLoading(true);
    try {
      const id = committee.id || committee.committeeId;
      const q = query(
        collection(db, 'committees', id, 'inventory'),
        where('module', '==', activeModule)
      );
      const snap = await getDocs(q);
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [committee, activeModule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committee) return;

    try {
      const id = committee.id || committee.committeeId;
      const itemData: Omit<InventoryItem, 'id'> = {
        module: activeModule,
        itemName: formData.itemName,
        unit: formData.unit,
        vendorName: formData.vendorName,
        quantityPurchased: Number(formData.quantityPurchased),
        quantityUsed: Number(formData.quantityUsed),
        pricePerUnit: Number(formData.pricePerUnit),
        year: new Date().getFullYear(),
        enteredBy: member?.memberId || 'ADMIN'
      };

      await addDoc(collection(db, 'committees', id, 'inventory'), itemData);
      setFormData({
        itemName: '', unit: '', vendorName: '',
        quantityPurchased: '', quantityUsed: '', pricePerUnit: ''
      });
      setIsAdding(false);
      fetchInventory();
      alert('Inventory item recorded!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const modules: InventoryModule[] = ['Lighting', 'Pandal', 'Visarjan', 'Bhog', 'Mandap'];

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inventory Tracker</h1>
            <p className="text-gray-500 font-medium font-sans">Monitor items and stock levels across departments</p>
          </div>
          {(allowedModule === 'all' || allowedModule === activeModule) && (
            <Button onClick={() => setIsAdding(!isAdding)} className="h-12">
               {isAdding ? 'Cancel' : <><Plus className="w-5 h-5 mr-2" /> Add Item</>}
            </Button>
          )}
        </header>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
           {modules.map(mod => (
              <button
                key={mod}
                onClick={() => { setActiveModule(mod); setIsAdding(false); }}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-2",
                  activeModule === mod 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-white border-orange-50 text-gray-400 hover:border-primary/20"
                )}
              >
                {mod}
              </button>
           ))}
        </div>

        {isAdding && (
          <Card className="border-2 border-primary/20 bg-orange-50/20">
            <h3 className="font-bold mb-4">New {activeModule} Item</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <Input label="Item Name" required value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} />
               <Input label="Unit (e.g. Kg, Pcs, Bundle)" required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
               <Input label="Vendor" value={formData.vendorName} onChange={e => setFormData({...formData, vendorName: e.target.value})} />
               <Input label="Qty Purchased" type="number" required value={formData.quantityPurchased} onChange={e => setFormData({...formData, quantityPurchased: e.target.value})} />
               <Input label="Qty Used" type="number" required value={formData.quantityUsed} onChange={e => setFormData({...formData, quantityUsed: e.target.value})} />
               <Input label="Price Per Unit (₹)" type="number" value={formData.pricePerUnit} onChange={e => setFormData({...formData, pricePerUnit: e.target.value})} />
               <div className="flex items-end">
                  <Button type="submit" className="w-full h-12">Record Stock</Button>
               </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {loading ? (
             <div className="col-span-full py-20 text-center text-gray-400">Loading inventory data...</div>
           ) : items.length > 0 ? (
             items.map(item => {
               const remaining = item.quantityPurchased - item.quantityUsed;
               const stockLevel = remaining / item.quantityPurchased;
               
               return (
                 <Card key={item.id} className="hover:border-primary/30 transition-all group overflow-visible">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-12 h-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                          {activeModule === 'Lighting' ? <TrendingUp /> : <Box />}
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{item.unit}</p>
                          <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                             {remaining} <span className="text-sm font-medium text-gray-400">left</span>
                          </p>
                       </div>
                    </div>

                    <h4 className="font-bold text-lg mb-4 text-gray-900">{item.itemName}</h4>
                    
                    <div className="space-y-4">
                       <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              stockLevel < 0.2 ? "bg-red-500" : stockLevel < 0.5 ? "bg-orange-500" : "bg-green-500"
                            )} 
                            style={{ width: `${Math.max(0, Math.min(100, stockLevel * 100))}%` }} 
                          />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                          <div className="flex items-center gap-2">
                             <Package className="w-3 h-3" /> Total: {item.quantityPurchased}
                          </div>
                          <div className="flex items-center gap-2">
                             <ShoppingBag className="w-3 h-3" /> Used: {item.quantityUsed}
                          </div>
                       </div>
                       
                       <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-500">
                          <div className="flex items-center gap-1">
                             <Truck className="w-3 h-3 text-primary" /> {item.vendorName}
                          </div>
                          <div className="font-bold text-accent">₹{item.pricePerUnit}/unit</div>
                       </div>
                    </div>

                    {stockLevel < 0.2 && (
                       <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg border-2 border-white animate-bounce">
                          <AlertCircle className="w-4 h-4" />
                       </div>
                    )}
                 </Card>
               );
             })
           ) : (
             <div className="col-span-full py-20 text-center text-gray-400">
                No items recorded for <strong>{activeModule}</strong> module yet.
             </div>
           )}
        </div>
      </div>
    </Layout>
  );
}
