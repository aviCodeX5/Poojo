import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { apiList } from '../lib/api';
import { AuditLog } from '../types';
import { History, Filter, Download, Eye, User, Calendar, FileText, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function AuditLogPage() {
  const { committee } = useAuth();
  const { isAdmin } = usePermissions();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'create' | 'update' | 'delete'>('all');

  const fetchAuditLogs = async () => {
    if (!committee) return;
    setLoading(true);
    try {
      const id = committee.id || committee.committeeId;
      const logs = await apiList<AuditLog>(id, 'auditLog');
      setLogs(logs.sort((a, b) => String(b.when).localeCompare(String(a.when))).slice(0, 100));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [committee]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.who.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.what.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      log.what.toLowerCase().startsWith(filterType.toLowerCase());
    
    return matchesSearch && matchesFilter;
  });

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().startsWith('create')) return '🆕';
    if (action.toLowerCase().startsWith('update')) return '✏️';
    if (action.toLowerCase().startsWith('delete')) return '🗑️';
    return '📝';
  };

  const getActionColor = (action: string) => {
    if (action.toLowerCase().startsWith('create')) return 'text-green-600 bg-green-50';
    if (action.toLowerCase().startsWith('update')) return 'text-blue-600 bg-blue-50';
    if (action.toLowerCase().startsWith('delete')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Action', 'Details', 'Previous Value', 'New Value'];
    const csvData = filteredLogs.map(log => [
      format(new Date(log.when), 'dd MMM yyyy, hh:mm a'),
      log.who,
      log.what,
      `${log.committeeId} - ${log.newValue?.id || 'N/A'}`,
      JSON.stringify(log.previousValue || {}),
      JSON.stringify(log.newValue || {})
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="text-center p-12 max-w-md">
            <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">Only administrators can view the audit log.</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Audit Log</h1>
            <p className="text-gray-500 font-medium">Track all system changes and activities</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} className="h-12">
              <Download className="w-5 h-5 mr-2" /> Export CSV
            </Button>
            <Button onClick={fetchAuditLogs} className="h-12">
              <History className="w-5 h-5 mr-2" /> Refresh
            </Button>
          </div>
        </header>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by user or action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Logs List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading audit logs...</div>
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <Card key={log.id} className="p-6 hover:border-primary/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0",
                    getActionColor(log.what)
                  )}>
                    {getActionIcon(log.what)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{log.who}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 font-mono">{log.what}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(log.when), 'dd MMM yyyy, hh:mm a')}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {log.newValue && (
                        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-green-700">New Value</span>
                          </div>
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white rounded p-2 border border-green-200">
                            {JSON.stringify(log.newValue, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {log.previousValue && (
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                          <div className="flex items-center gap-2 mb-1">
                            <History className="w-3 h-3 text-orange-600" />
                            <span className="text-xs font-medium text-orange-700">Previous Value</span>
                          </div>
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white rounded p-2 border border-orange-200">
                            {JSON.stringify(log.previousValue, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="text-gray-400 font-medium">No audit logs found</div>
              <p className="text-gray-400 text-sm mt-2">System activities will appear here once users start making changes.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
