import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { Member } from '../types';
import { Download, Users, Shield, User, Building2 } from 'lucide-react';
import jsPDF from 'jspdf';

export default function OrgChart() {
  const { committee, member } = useAuth();
  const { role } = usePermissions();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user has access to org chart (admin, secretary, joint secretary)
  const hasAccess = role === 'ADMIN' || role === 'SECRETARY' || role === 'JOINT_SECRETARY';

  useEffect(() => {
    if (!committee || !hasAccess) return;
    fetchMembers();
  }, [committee, hasAccess]);

  const fetchMembers = async () => {
    if (!committee) return;
    setLoading(true);
    try {
      const id = committee.id || committee.committeeId;
      const q = query(collection(db, 'committees', id, 'members'), orderBy('addedAt', 'desc'));
      const snap = await getDocs(q);
      const membersList = snap.docs.map(d => d.data() as Member);
      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group members by role
  const groupByRole = () => {
    const groups: { [key: string]: Member[] } = {};
    members.forEach(member => {
      const role = member.role;
      if (!groups[role]) {
        groups[role] = [];
      }
      groups[role].push(member);
    });
    return groups;
  };

  const roleGroups = groupByRole();

  // Role display order
  const roleOrder = ['ADMIN', 'SECRETARY', 'JOINT_SECRETARY', 'CASHIER', 'LIGHT_INCHARGE', 'PANDAL_INCHARGE', 'DONATION_INCHARGE', 'CHANDA_INCHARGE', 'VISARJAN_INCHARGE', 'CULTURAL_INCHARGE', 'MANDAP_INCHARGE', 'CHANDA_VOLUNTEER', 'MEMBER'];

  // Format role name for display
  const formatRoleName = (role: string) => {
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Generate PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(255, 107, 53);
    doc.text('Organizational Chart', 105, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(16);
    doc.setTextColor(139, 26, 26);
    doc.text(committee?.name || 'SamitiBook', 105, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });
    yPos += 20;

    // Group by role
    const sortedRoles = Object.keys(roleGroups).sort((a, b) => {
      const indexA = roleOrder.indexOf(a) === -1 ? 999 : roleOrder.indexOf(a);
      const indexB = roleOrder.indexOf(b) === -1 ? 999 : roleOrder.indexOf(b);
      return indexA - indexB;
    });

    sortedRoles.forEach(role => {
      // Role header
      doc.setFontSize(14);
      doc.setTextColor(255, 107, 53);
      doc.text(formatRoleName(role), 20, yPos);
      yPos += 8;

      // Members in this role
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      roleGroups[role].forEach(member => {
        const memberText = `• ${member.name} (${member.phone})`;
        doc.text(memberText, 25, yPos);
        yPos += 6;
      });

      yPos += 10;

      // Add new page if needed
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    doc.save(`${committee?.name || 'committee'}-org-chart.pdf`);
  };

  if (!hasAccess) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-500">Only Admin, Secretary, and Joint Secretary can view the organizational chart.</p>
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

  const sortedRoles = Object.keys(roleGroups).sort((a, b) => {
    const indexA = roleOrder.indexOf(a) === -1 ? 999 : roleOrder.indexOf(a);
    const indexB = roleOrder.indexOf(b) === -1 ? 999 : roleOrder.indexOf(b);
    return indexA - indexB;
  });

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Organizational Chart</h1>
            <p className="text-gray-500 font-medium font-sans">View committee structure and member roles</p>
          </div>
          <Button onClick={downloadPDF} className="h-12">
            <Download className="w-5 h-5 mr-2" /> Download PDF
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRoles.map(role => (
            <Card key={role} className="border-2 border-primary/20 bg-orange-50/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{formatRoleName(role)}</h3>
                  <p className="text-sm text-gray-500">{roleGroups[role].length} member{roleGroups[role].length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {roleGroups[role].map(member => (
                  <div key={member.memberId} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-orange-100">
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {members.length === 0 && (
          <div className="py-20 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-orange-200">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No members found in the committee.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
