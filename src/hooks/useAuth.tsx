import React, { createContext, useContext, useEffect, useState } from 'react';
import { Committee, Member, PujaEdition } from '../types';
import {
  AppUser,
  clearSessionToken,
  confirmAdminRegistration,
  getCurrentEdition,
  getSession,
  getSessionToken,
  loginAdmin,
  loginMember,
  logoutSession,
  startAdminRegistration,
} from '../lib/api';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  committee: Committee | null;
  member: Member | null;
  isAdminAccount: boolean;
  currentEdition: PujaEdition | null;
  refreshCommittee: () => Promise<void>;
  loginWithAdminPassword: (email: string, password: string) => Promise<string>;
  loginWithMemberCode: (phone: string, code: string) => Promise<string>;
  startRegistration: (payload: Record<string, unknown>) => Promise<{ email: string; delivery: string; developmentCode?: string }>;
  confirmRegistration: (email: string, code: string) => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [isAdminAccount, setIsAdminAccount] = useState(false);
  const [currentEdition, setCurrentEdition] = useState<PujaEdition | null>(null);

  const applySession = async () => {
    const session = await getSession();
    setUser(session.user);
    setCommittee(session.committee);
    setMember(session.member);
    setIsAdminAccount(session.user.type === 'ADMIN');
    setCurrentEdition(await getCurrentEdition(session.committee));
    return session.committee.committeeId || session.committee.id!;
  };

  useEffect(() => {
    const init = async () => {
      if (!getSessionToken()) {
        setLoading(false);
        return;
      }
      try {
        await applySession();
      } catch {
        clearSessionToken();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const refreshCommittee = async () => {
    if (getSessionToken()) await applySession();
  };

  const loginWithAdminPassword = async (email: string, password: string) => {
    const data = await loginAdmin(email, password);
    setUser(data.user);
    setCommittee(data.committee);
    setMember(null);
    setIsAdminAccount(true);
    setCurrentEdition(await getCurrentEdition(data.committee));
    return data.committee.committeeId || data.committee.id!;
  };

  const loginWithMemberCode = async (phone: string, code: string) => {
    const data = await loginMember(phone, code);
    const sessionUser: AppUser = {
      uid: data.member.memberId,
      email: null,
      phoneNumber: data.member.phone,
      type: 'MEMBER',
    };
    setUser(sessionUser);
    setCommittee(data.committee);
    setMember(data.member);
    setIsAdminAccount(false);
    setCurrentEdition(await getCurrentEdition(data.committee));
    return data.committee.committeeId || data.committee.id!;
  };

  const startRegistration = async (payload: Record<string, unknown>) => {
    const result = await startAdminRegistration(payload);
    return { email: result.email, delivery: result.delivery, developmentCode: result.developmentCode };
  };

  const confirmRegistration = async (email: string, code: string) => {
    const data = await confirmAdminRegistration(email, code);
    setUser(data.user);
    setCommittee(data.committee);
    setMember(null);
    setIsAdminAccount(true);
    setCurrentEdition(await getCurrentEdition(data.committee));
    return data.committee.committeeId || data.committee.id!;
  };

  const logout = async () => {
    if (getSessionToken()) {
      await logoutSession().catch(() => undefined);
    }
    clearSessionToken();
    setUser(null);
    setCommittee(null);
    setMember(null);
    setIsAdminAccount(false);
    setCurrentEdition(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      committee,
      member,
      isAdminAccount,
      currentEdition,
      refreshCommittee,
      loginWithAdminPassword,
      loginWithMemberCode,
      startRegistration,
      confirmRegistration,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
