'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

const DashboardLayout = ({ children }) => {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        const userDocRef = doc(db, 'MASUDUR_RAHMAN_DATABASE', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          console.error('User profile not found in database.');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('User Profile Fetch Error:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <DashboardSidebar userProfile={userProfile} loading={loading} />
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default DashboardLayout;