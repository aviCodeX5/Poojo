import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Member, Committee, PujaEdition } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  committee: Committee | null;
  member: Member | null;
  isAdminAccount: boolean;
  currentEdition: PujaEdition | null;
  refreshCommittee: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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

      // 2. Check if user is a Member (OTP Login)
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchCommitteeData(firebaseUser);
      } else {
        setCommittee(null);
        setMember(null);
        setIsAdminAccount(false);
        setCurrentEdition(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshCommittee = async () => {
    if (user) await fetchCommitteeData(user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, committee, member, isAdminAccount, currentEdition, refreshCommittee }}>
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
