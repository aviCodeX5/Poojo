import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import MemberLogin from './pages/MemberLogin';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Chanda from './pages/Chanda';
import Donations from './pages/Donations';
import Expenses from './pages/Expenses';
import Inventory from './pages/Inventory';
import Cultural from './pages/Cultural';
import Mandap from './pages/Mandap';
import Analytics from './pages/Analytics';
import Broadcasts from './pages/Broadcasts';
import Settings from './pages/Settings';
import OrgChart from './pages/OrgChart';
import RoleManagement from './pages/RoleManagement';
import PujaEditions from './pages/PujaEditions';
import AuditLog from './pages/AuditLog';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-cream">
       <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-lg" />
    </div>
  );
  
  if (!user) return <Navigate to="/" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/member-login" element={<MemberLogin />} />
            
            <Route path="/:committeeId/*" element={
              <ProtectedRoute>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="members" element={<Members />} />
                  <Route path="chanda" element={<Chanda />} />
                  <Route path="donations" element={<Donations />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="cultural" element={<Cultural />} />
                  <Route path="mandap" element={<Mandap />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="broadcasts" element={<Broadcasts />} />
                  <Route path="audit-log" element={<AuditLog />} />
                  <Route path="org-chart" element={<OrgChart />} />
                  <Route path="role-management" element={<RoleManagement />} />
                  <Route path="puja-editions" element={<PujaEditions />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="dashboard" />} />
                </Routes>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}



