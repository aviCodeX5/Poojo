import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { apiCreate, apiDelete, apiList, apiUpdate, apiUpdateCommittee } from '../lib/api';
import { EditionMember, Member, PujaEdition } from '../types';
import { ROLES } from '../constants';
import { SuccessDialog } from '../components/ui/SuccessDialog';
import { Plus, Calendar, DollarSign, Palette, Shield, CheckCircle2, X, Save, History } from 'lucide-react';

export default function PujaEditions() {
  const { committee, member, refreshCommittee } = useAuth();
  const { role } = usePermissions();
  const [editions, setEditions] = useState<PujaEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEditionForm, setShowNewEditionForm] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [carryForwardMembers, setCarryForwardMembers] = useState(true);
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    pujaType: '',
    editionName: '',
    startDate: '',
    endDate: '',
    committeeDesignation: '',
    budget: '',
    theme: ''
  });

  // Only admin can access edition management
  const hasAccess = role === 'ADMIN';

  useEffect(() => {
    if (!committee || !hasAccess) return;
    fetchEditions();
  }, [committee, hasAccess]);

  const fetchEditions = async () => {
    if (!committee) return;
    setLoading(true);
    try {
      const id = committee.id || committee.committeeId;
      const editionsList = (await apiList<PujaEdition>(id, 'editions')).sort((a, b) => b.year - a.year);
      setEditions(editionsList);
      
      // Set selected edition to the active one
      const activeEdition = editionsList.find(e => e.isActive);
      if (activeEdition) {
        setSelectedEdition(activeEdition.id);
      }
      const memberList = await apiList<Member>(id, 'members');
      setMembers(memberList);
      setMemberRoles(Object.fromEntries(memberList.map(m => [m.memberId, m.role])));
    } catch (error) {
      console.error('Error fetching editions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEdition = async () => {
    if (!committee || !formData.pujaType) return;
    try {
      const id = committee.id || committee.committeeId;
      
      // Deactivate all existing editions
      for (const edition of editions) {
        await apiUpdate<PujaEdition>(id, 'editions', edition.id!, { isActive: false });
      }

      const newEdition = await apiCreate<PujaEdition>(id, 'editions', {
        year: formData.year,
        pujaType: formData.pujaType,
        editionName: formData.editionName,
        startDate: formData.startDate,
        endDate: formData.endDate,
        committeeDesignation: formData.committeeDesignation,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        theme: formData.theme,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: member?.memberId || 'ADMIN'
      });

      // Update committee with current edition
      await apiUpdateCommittee(id, {
        currentEditionId: newEdition.id,
        currentYear: formData.year
      });

      if (carryForwardMembers) {
        await Promise.all(members.map((committeeMember) => apiCreate<EditionMember>(id, 'editionMembers', {
          editionId: newEdition.id,
          memberId: committeeMember.memberId,
          role: memberRoles[committeeMember.memberId] || committeeMember.role,
          designation: memberRoles[committeeMember.memberId] || committeeMember.role,
          addedAt: new Date().toISOString(),
          addedBy: member?.memberId || 'ADMIN',
          isActive: true,
        })));
      }

      // Reset form
      setFormData({
        year: new Date().getFullYear(),
        pujaType: '',
        editionName: '',
        startDate: '',
        endDate: '',
        committeeDesignation: '',
        budget: '',
        theme: ''
      });
      setShowNewEditionForm(false);
      fetchEditions();
      await refreshCommittee();
      setSuccess({
        title: 'Edition Created',
        message: carryForwardMembers
          ? 'New puja edition created successfully and committee members were carried forward.'
          : 'New puja edition created successfully.',
      });
    } catch (error) {
      console.error('Error creating edition:', error);
      setSuccess({ title: 'Edition Not Created', message: 'Failed to create edition. Please review the details and try again.' });
    }
  };

  const handleSetCurrentEdition = async (editionId: string) => {
    if (!committee) return;
    try {
      const id = committee.id || committee.committeeId;
      
      // Deactivate all editions
      for (const edition of editions) {
        await apiUpdate<PujaEdition>(id, 'editions', edition.id!, { isActive: false });
      }

      await apiUpdate<PujaEdition>(id, 'editions', editionId, { isActive: true });

      await apiUpdateCommittee(id, {
        currentEditionId: editionId,
        currentYear: editions.find(e => e.id === editionId)?.year
      });

      setSelectedEdition(editionId);
      fetchEditions();
      await refreshCommittee();
      setSuccess({ title: 'Current Edition Updated', message: 'The selected puja edition is now active.' });
    } catch (error) {
      console.error('Error setting current edition:', error);
      setSuccess({ title: 'Edition Not Updated', message: 'Failed to set current edition. Please try again.' });
    }
  };

  const handleDeleteEdition = async (editionId: string) => {
    if (!committee) return;
    if (!confirm('Are you sure you want to delete this edition? This will not delete associated data.')) return;
    try {
      const id = committee.id || committee.committeeId;
      await apiDelete(id, 'editions', editionId);
      fetchEditions();
      setSuccess({ title: 'Edition Deleted', message: 'The puja edition was deleted successfully.' });
    } catch (error) {
      console.error('Error deleting edition:', error);
      setSuccess({ title: 'Edition Not Deleted', message: 'Failed to delete edition. Please try again.' });
    }
  };

  if (!hasAccess) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-500">Only Admin can manage puja editions.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Puja Editions</h1>
            <p className="text-gray-500 font-medium font-sans">Manage yearly puja events and committee designations</p>
          </div>
          <Button onClick={() => setShowNewEditionForm(!showNewEditionForm)} className="h-12">
            <Plus className="w-5 h-5 mr-2" /> Create New Edition
          </Button>
        </header>

        {/* Create New Edition Form */}
        {showNewEditionForm && (
          <Card className="border-2 border-primary/20 bg-orange-50/20">
            <h3 className="font-bold mb-4">Create New Puja Edition</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
              />
              <Input
                label="Puja Type"
                placeholder="e.g., Durga, Ganesh, Kali"
                value={formData.pujaType}
                onChange={(e) => setFormData({...formData, pujaType: e.target.value})}
              />
              <Input
                label="Edition Name (Optional)"
                placeholder="e.g., 2024 Silver Jubilee"
                value={formData.editionName}
                onChange={(e) => setFormData({...formData, editionName: e.target.value})}
              />
              <Input
                label="Committee Designation (Optional)"
                placeholder="e.g., Diamond Park Pooja Samiti"
                value={formData.committeeDesignation}
                onChange={(e) => setFormData({...formData, committeeDesignation: e.target.value})}
              />
              <Input
                label="Theme (Optional)"
                placeholder="e.g., Traditional Heritage"
                value={formData.theme}
                onChange={(e) => setFormData({...formData, theme: e.target.value})}
              />
              <Input
                label="Budget (₹)"
                type="number"
                placeholder="e.g., 500000"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
              />
              <Input
                label="Start Date (Optional)"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
              <Input
                label="End Date (Optional)"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
            {members.length > 0 && (
              <div className="mt-6 rounded-xl border border-blue-100 bg-white p-4">
                <label className="flex items-center gap-3 text-sm font-black text-slate-800">
                  <input
                    type="checkbox"
                    checked={carryForwardMembers}
                    onChange={(e) => setCarryForwardMembers(e.target.checked)}
                    className="h-4 w-4 rounded border-blue-200 text-primary"
                  />
                  Carry forward existing committee members
                </label>
                <p className="mt-1 text-xs font-semibold text-slate-500">Keep the same committee or adjust roles before creating this edition.</p>
                {carryForwardMembers && (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {members.map((committeeMember) => (
                      <div key={committeeMember.memberId} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <div className="text-sm font-black text-slate-900">{committeeMember.name}</div>
                        <label className="mt-2 block text-xs font-bold text-slate-500" htmlFor={`role-${committeeMember.memberId}`}>
                          Role for {committeeMember.name}
                        </label>
                        <select
                          id={`role-${committeeMember.memberId}`}
                          aria-label={`Role for ${committeeMember.name}`}
                          value={memberRoles[committeeMember.memberId] || committeeMember.role}
                          onChange={(e) => setMemberRoles({ ...memberRoles, [committeeMember.memberId]: e.target.value })}
                          className="mt-1 h-10 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                        >
                          {ROLES.map(roleOption => (
                            <option key={roleOption} value={roleOption}>{roleOption.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreateEdition}>
                <Save className="w-4 h-4 mr-2" /> Create Edition
              </Button>
              <Button variant="outline" onClick={() => setShowNewEditionForm(false)}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Editions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">All Editions</h2>
          {editions.length === 0 ? (
            <div className="py-8 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-orange-200">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No puja editions created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {editions.map(edition => (
                <Card 
                  key={edition.id} 
                  className={`border-2 ${edition.isActive ? 'border-primary/40 bg-orange-50/30' : 'border-gray-200 bg-white'} transition-all`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg ${edition.isActive ? 'bg-primary' : 'bg-gray-400'}`}>
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{edition.year}</h3>
                        <p className="text-sm text-gray-500">{edition.pujaType}</p>
                      </div>
                    </div>
                    {edition.isActive && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {edition.editionName && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">Name:</span>
                        <span className="text-gray-600">{edition.editionName}</span>
                      </div>
                    )}
                    {edition.committeeDesignation && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">Designation:</span>
                        <span className="text-gray-600">{edition.committeeDesignation}</span>
                      </div>
                    )}
                    {edition.theme && (
                      <div className="flex items-center gap-2 text-sm">
                        <Palette className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{edition.theme}</span>
                      </div>
                    )}
                    {edition.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">₹{edition.budget.toLocaleString()}</span>
                      </div>
                    )}
                    {edition.startDate && edition.endDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(edition.startDate).toLocaleDateString()} - {new Date(edition.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!edition.isActive && (
                      <Button 
                        size="sm" 
                        onClick={() => edition.id && handleSetCurrentEdition(edition.id)}
                        className="flex-1"
                      >
                        Set Current
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => edition.id && handleDeleteEdition(edition.id)}
                      className="text-red-500 border-red-200 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <SuccessDialog
        open={!!success}
        title={success?.title || ''}
        message={success?.message || ''}
        onClose={() => setSuccess(null)}
      />
    </Layout>
  );
}
