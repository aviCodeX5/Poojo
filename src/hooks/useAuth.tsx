import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Member, Committee, PujaEdition } from '../types';

type AppUser = Pick<User, 'uid' | 'email' | 'phoneNumber'> & {
  type?: 'ADMIN' | 'MEMBER';
};

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  committee: Committee | null;
  member: Member | null;
  isAdminAccount: boolean;
  currentEdition: PujaEdition | null;
  refreshCommittee: () => Promise<void>;
  loginWithMemberCode: (phone: string, code: string) => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const D1_SESSION_TOKEN_KEY = 'samitibook.d1SessionToken';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [isAdminAccount, setIsAdminAccount] = useState(false);
  const [currentEdition, setCurrentEdition] = useState<PujaEdition | null>(null);

  const fetchCommitteeData = async (firebaseUser: User) => {
    try {
      // 1. Check if user is an Admin of a committee
      const committeesRef = collection(db, 'committees');
      const adminQuery = query(committeesRef, where('adminUID', '==', firebaseUser.uid));
      const adminDocs = await getDocs(adminQuery);

      if (!adminDocs.empty) {
        const docSnap = adminDocs.docs[0];
        const data = docSnap.data();
        const committeeData = { id: docSnap.id, ...data } as unknown as Committee;
        setCommittee(committeeData);
        setIsAdminAccount(true);
        setMember(null); // Admins are masters

        // Fetch current edition
        if (committeeData.currentEditionId) {
          const editionRef = doc(db, 'committees', docSnap.id, 'editions', committeeData.currentEditionId);
          const editionSnap = await getDoc(editionRef);
          if (editionSnap.exists()) {
            setCurrentEdition({ id: editionSnap.id, ...editionSnap.data() } as PujaEdition);
          }
        }
        return;
      }

      // 2. Legacy Firebase phone-auth fallback for older member sessions.
      // Member phone is stored in Firebase Auth user.phoneNumber (E.164)
      if (firebaseUser.phoneNumber) {
        const phone = firebaseUser.phoneNumber;
        // Since member login requires committee selection or discovery,
        // in a real app we might store currentCommitteeId in localStorage or query params.
        // For simplicity, we'll try to find any committee where this phone is an active member.
        // In a multi-committee scenario, the user would select one.
        const allCommittees = await getDocs(collection(db, 'committees'));
        for (const commDoc of allCommittees.docs) {
          const memberRef = doc(db, 'committees', commDoc.id, 'members', phone);
          const memberSnap = await getDoc(memberRef);
          if (memberSnap.exists()) {
            const commData = commDoc.data();
            const committeeData = { id: commDoc.id, ...commData } as unknown as Committee;
            setCommittee(committeeData);
            setMember(memberSnap.data() as Member);
            setIsAdminAccount(false);

            // Fetch current edition
            if (committeeData.currentEditionId) {
              const editionRef = doc(db, 'committees', commDoc.id, 'editions', committeeData.currentEditionId);
              const editionSnap = await getDoc(editionRef);
              if (editionSnap.exists()) {
                setCurrentEdition({ id: editionSnap.id, ...editionSnap.data() } as PujaEdition);
              }
            }
            return;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching auth data:", error);
    }
  };

  const applyD1Session = async (token: string) => {
    const response = await fetch('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Member session expired');
    const data = await response.json();

    setUser(data.user as AppUser);
    setCommittee(data.committee as Committee);
    setMember(data.member as Member);
    setIsAdminAccount(false);

    if (data.committee?.currentEditionId) {
      const editionResponse = await fetch(`/api/d1/committees/${data.committee.committeeId}/editions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (editionResponse.ok) {
        const editionData = await editionResponse.json();
        const current = editionData.records?.find((entry: PujaEdition) => entry.id === data.committee.currentEditionId);
        setCurrentEdition(current || null);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.removeItem(D1_SESSION_TOKEN_KEY);
        await fetchCommitteeData(firebaseUser);
      } else {
        const token = localStorage.getItem(D1_SESSION_TOKEN_KEY);
        if (token) {
          try {
            await applyD1Session(token);
          } catch {
            localStorage.removeItem(D1_SESSION_TOKEN_KEY);
            setUser(null);
            setCommittee(null);
            setMember(null);
            setIsAdminAccount(false);
            setCurrentEdition(null);
          }
        } else {
          setUser(null);
          setCommittee(null);
          setMember(null);
          setIsAdminAccount(false);
          setCurrentEdition(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshCommittee = async () => {
    const currentUser = user || auth.currentUser;
    const token = localStorage.getItem(D1_SESSION_TOKEN_KEY);
    if (auth.currentUser) {
      await fetchCommitteeData(auth.currentUser);
    } else if (token) {
      await applyD1Session(token);
    } else if (currentUser && 'uid' in currentUser) {
      setUser(currentUser);
    }
  };

  const loginWithMemberCode = async (phone: string, code: string) => {
    const response = await fetch('/api/auth/member-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Unable to login with this mobile number and code');
    }

    localStorage.setItem(D1_SESSION_TOKEN_KEY, data.token);
    setUser({
      uid: data.member.memberId,
      email: null,
      phoneNumber: data.member.phone,
      type: 'MEMBER',
    });
    setCommittee(data.committee as Committee);
    setMember(data.member as Member);
    setIsAdminAccount(false);
    setCurrentEdition(null);
    return data.committee.committeeId || data.committee.id;
  };

  const logout = async () => {
    const token = localStorage.getItem(D1_SESSION_TOKEN_KEY);
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
      localStorage.removeItem(D1_SESSION_TOKEN_KEY);
    }
    await auth.signOut();
    setUser(null);
    setCommittee(null);
    setMember(null);
    setIsAdminAccount(false);
    setCurrentEdition(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, committee, member, isAdminAccount, currentEdition, refreshCommittee, loginWithMemberCode, logout }}>
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
