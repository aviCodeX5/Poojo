import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { apiCreate, apiList, apiUpdate, apiUpdateCommittee } from '../lib/api';
import { Settings as SettingsIcon, ShieldAlert, Save, Copy, Trash2, Globe, Calendar, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { committee, currentEdition, refreshCommittee } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showRolloverForm, setShowRolloverForm] = useState(false);
  const [rolloverData, setRolloverData] = useState({
    year: new Date().getFullYear(),
    pujaType: '',
    editionName: '',
    theme: ''
  });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: committee?.name || '',
    pandalAddress: committee?.pandalAddress || '',
    city: committee?.city || '',
    state: committee?.state || '',
    pincode: committee?.pincode || '',
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committee) return;
    setIsSaving(true);
    try {
      const id = committee.id || committee.committeeId;
      await apiUpdateCommittee(id, formData);
      await refreshCommittee();
      alert('Committee settings updated!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const copyId = () => {
    if (committee) {
      navigator.clipboard.writeText(committee.committeeId || committee.id);
      alert('Committee ID copied!');
    }
  };

  const handleYearRollover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committee || !rolloverData.pujaType) return;
    try {
      const id = committee.id || committee.committeeId;

      // Deactivate all existing editions
      const editions = await apiList<any>(id, 'editions');
      for (const edition of editions) {
        await apiUpdate(id, 'editions', edition.id, { isActive: false });
      }

      const newEdition = await apiCreate<any>(id, 'editions', {
        year: rolloverData.year,
        pujaType: rolloverData.pujaType,
        editionName: rolloverData.editionName,
        theme: rolloverData.theme,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: committee.adminEmail
      });

      await apiUpdateCommittee(id, {
        currentEditionId: newEdition.id,
        currentYear: rolloverData.year
      });

      setRolloverData({
        year: new Date().getFullYear(),
        pujaType: '',
        editionName: '',
        theme: ''
      });
      setShowRolloverForm(false);
      await refreshCommittee();
      alert('New year edition created successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl">
        <header>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Settings</h1>
          <p className="text-gray-500 font-medium">Control committee profile and global preferences</p>
        </header>

        <Card className="p-8 border-2 border-primary/10">
           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-8 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                    <Globe className="w-8 h-8" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-gray-900">Digital Identifier</h3>
                    <p className="text-gray-400 text-sm font-medium">Unique ID for your committee</p>
                 </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 w-fit">
                 <span className="font-mono font-black text-accent tracking-tighter">{committee?.committeeId || committee?.id}</span>
                 <button onClick={copyId} className="p-1 hover:text-primary transition-colors">
                    <Copy className="w-4 h-4" />
                 </button>
              </div>
           </div>

           <form onSubmit={handleUpdate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input label="Committee Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 <Input label="Pandal Address" value={formData.pandalAddress} onChange={e => setFormData({...formData, pandalAddress: e.target.value})} />
                 <Input label="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                 <Input label="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                 <Input label="Pincode" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
              </div>

              <div className="flex justify-end pt-4">
                 <Button type="submit" size="lg" className="w-full sm:w-auto px-12" isLoading={isSaving}>
                    <Save className="w-5 h-5 mr-2" /> Save Profile Changes
                 </Button>
              </div>
           </form>
        </Card>

        {/* Year Rollover / New Edition */}
        <div className="space-y-4 pt-10">
           <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6" /> Year Rollover
           </h3>
           <Card className="border-primary/20 bg-orange-50/10">
              <div className="space-y-4">
                 <div>
                    <h4 className="font-bold text-gray-900">Current Edition</h4>
                    {currentEdition ? (
                      <p className="text-sm text-gray-600">
                        {currentEdition.year} - {currentEdition.pujaType}
                        {currentEdition.editionName && ` (${currentEdition.editionName})`}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">No active edition set</p>
                    )}
                 </div>

                 {showRolloverForm ? (
                   <form onSubmit={handleYearRollover} className="space-y-4 pt-4 border-t border-gray-200">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Input
                         label="Year"
                         type="number"
                         value={rolloverData.year}
                         onChange={(e) => setRolloverData({...rolloverData, year: parseInt(e.target.value)})}
                       />
                       <Input
                         label="Puja Type"
                         placeholder="e.g., Durga, Ganesh, Kali"
                         value={rolloverData.pujaType}
                         onChange={(e) => setRolloverData({...rolloverData, pujaType: e.target.value})}
                         required
                       />
                       <Input
                         label="Edition Name (Optional)"
                         placeholder="e.g., 2024 Silver Jubilee"
                         value={rolloverData.editionName}
                         onChange={(e) => setRolloverData({...rolloverData, editionName: e.target.value})}
                       />
                       <Input
                         label="Theme (Optional)"
                         placeholder="e.g., Traditional Heritage"
                         value={rolloverData.theme}
                         onChange={(e) => setRolloverData({...rolloverData, theme: e.target.value})}
                       />
                     </div>
                     <div className="flex gap-2">
                       <Button type="submit">
                         <RefreshCw className="w-4 h-4 mr-2" /> Create New Edition
                       </Button>
                       <Button variant="outline" type="button" onClick={() => setShowRolloverForm(false)}>
                         Cancel
                       </Button>
                     </div>
                   </form>
                 ) : (
                   <Button onClick={() => setShowRolloverForm(true)} variant="outline" className="w-full sm:w-auto">
                     <RefreshCw className="w-4 h-4 mr-2" /> Start New Year
                   </Button>
                 )}
              </div>
           </Card>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4 pt-10">
           <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6" /> Danger Zone
           </h3>
           <Card className="border-red-100 bg-red-50/10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                 <div>
                    <h4 className="font-bold text-gray-900">Delete Committee</h4>
                    <p className="text-sm text-gray-500 font-medium">Warning: This action is permanent and will delete all ledgers, members, and data associated with this committee ID.</p>
                 </div>
                 <Button variant="danger" className="h-12 px-8 flex items-center shadow-lg shadow-red-100">
                    <Trash2 className="w-5 h-5 mr-2" /> Delete Committee
                 </Button>
              </div>
           </Card>
        </div>
      </div>
    </Layout>
  );
}
