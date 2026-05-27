import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { apiCreate, apiDelete, apiList, apiUpdate } from '../lib/api';
import { Member, CustomRole } from '../types';
import { Plus, Trash2, UserPlus, Shield, X, Save } from 'lucide-react';

export default function RoleManagement() {
  const { committee, member } = useAuth();
  const { role } = usePermissions();
  const [members, setMembers] = useState<Member[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [showAssignRoleForm, setShowAssignRoleForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const DEFAULT_ROLES = ['ADMIN', 'SECRETARY', 'JOINT_SECRETARY', 'CASHIER', 'LIGHT_INCHARGE', 'PANDAL_INCHARGE', 'DONATION_INCHARGE', 'CHANDA_INCHARGE', 'VISARJAN_INCHARGE', 'CULTURAL_INCHARGE', 'MANDAP_INCHARGE', 'CHANDA_VOLUNTEER', 'MEMBER'];

  // Only admin can access role management
  const hasAccess = role === 'ADMIN';

  useEffect(() => {
    if (!committee || !hasAccess) return;
    fetchData();
  }, [committee, hasAccess]);

  const fetchData = async () => {
    if (!committee) return;
    setLoading(true);
    try {
      const id = committee.id || committee.committeeId;
      
      // Fetch members
      const membersList = await apiList<Member>(id, 'members');
      setMembers(membersList);

      const rolesList = await apiList<CustomRole>(id, 'customRoles');
      setCustomRoles(rolesList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!committee || !newRoleName.trim()) return;
    try {
      const id = committee.id || committee.committeeId;
      await apiCreate<CustomRole>(id, 'customRoles', {
        name: newRoleName.trim().toUpperCase(),
        description: newRoleDescription.trim(),
        permissions: [], // Default permissions - can be extended later
        createdAt: new Date().toISOString(),
        createdBy: member?.memberId || 'ADMIN'
      });
      setNewRoleName('');
      setNewRoleDescription('');
      setShowNewRoleForm(false);
      fetchData();
      alert('Custom role created successfully');
    } catch (error) {
      console.error('Error creating role:', error);
      alert('Failed to create role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!committee) return;
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      const id = committee.id || committee.committeeId;
      await apiDelete(id, 'customRoles', roleId);
      fetchData();
      alert('Role deleted successfully');
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Failed to delete role');
    }
  };

  const handleAssignRole = async () => {
    if (!committee || !selectedMember || !selectedRole) return;
    try {
      const id = committee.id || committee.committeeId;
      await apiUpdate<Member>(id, 'members', selectedMember, {
        role: selectedRole
      });
      setSelectedMember('');
      setSelectedRole('');
      setShowAssignRoleForm(false);
      fetchData();
      alert('Role assigned successfully');
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Failed to assign role');
    }
  };

  const allRoles = [...DEFAULT_ROLES, ...customRoles.map(r => r.name)];

  if (!hasAccess) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-500">Only Admin can manage roles.</p>
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
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Role Management</h1>
            <p className="text-gray-500 font-medium font-sans">Create custom roles and assign members</p>
          </div>
          <Button onClick={() => setShowNewRoleForm(!showNewRoleForm)} className="h-12">
            <Plus className="w-5 h-5 mr-2" /> Create Custom Role
          </Button>
        </header>

        {/* Create Custom Role Form */}
        {showNewRoleForm && (
          <Card className="border-2 border-primary/20 bg-orange-50/20">
            <h3 className="font-bold mb-4">Create New Custom Role</h3>
            <div className="space-y-4">
              <Input
                label="Role Name"
                placeholder="e.g., TREASURER"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value.toUpperCase())}
              />
              <Input
                label="Description"
                placeholder="Describe the responsibilities of this role"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateRole}>
                  <Save className="w-4 h-4 mr-2" /> Create Role
                </Button>
                <Button variant="outline" onClick={() => setShowNewRoleForm(false)}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Custom Roles List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Custom Roles</h2>
          {customRoles.length === 0 ? (
            <div className="py-8 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-orange-200">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No custom roles created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customRoles.map(customRole => (
                <Card key={customRole.id} className="border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{customRole.name}</h3>
                      {customRole.description && (
                        <p className="text-sm text-gray-500 mt-1">{customRole.description}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => customRole.id && handleDeleteRole(customRole.id)}
                      className="text-red-500 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Assign Role to Member */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Assign Role to Member</h2>
            <Button onClick={() => setShowAssignRoleForm(!showAssignRoleForm)} variant="outline" className="h-10">
              <UserPlus className="w-4 h-4 mr-2" /> Assign Role
            </Button>
          </div>

          {showAssignRoleForm && (
            <Card className="border-2 border-primary/20 bg-orange-50/20">
              <h3 className="font-bold mb-4">Assign Role</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 ml-1">Select Member</label>
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  >
                    <option value="">Select a member</option>
                    {members.map(m => (
                      <option key={m.memberId} value={m.memberId}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 ml-1">Select Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  >
                    <option value="">Select a role</option>
                    {allRoles.map(r => (
                      <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAssignRole}>
                    <Save className="w-4 h-4 mr-2" /> Assign Role
                  </Button>
                  <Button variant="outline" onClick={() => setShowAssignRoleForm(false)}>
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Members with their current roles */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">All Members and Roles</h2>
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Current Role</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.memberId} className="border-t border-gray-100">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{member.phone}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {member.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No members found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
