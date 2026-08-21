'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  Building2,
  Calendar,
  Crown,
  Loader2,
  CheckCircle2,
  MapPin,
  Clock,
} from 'lucide-react';

const AdminDashboard = () => {
  const router = useRouter();
  const [adminProfile, setAdminProfile] = useState(null);
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

        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setAdminProfile({ id: user.uid, ...userDoc.data() });
        } else {
          alert('আপনার এই পেজে ঢোকার অনুমতি নেই!');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Admin Profile Fetch Error:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-600 font-medium">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>প্রোফাইল তথ্য লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
      {/* Profile Header & Banner Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        {/* Cover Gradient */}
        <div
          className="h-36 md:h-48 relative bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-cover bg-center"
          style={adminProfile?.coverImageUrl ? { backgroundImage: `url(${adminProfile.coverImageUrl})` } : undefined}
        >
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Administrator
            </span>
          </div>
        </div>

        {/* Profile Identity Bar */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
            {/* Avatar */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-white shadow-md bg-indigo-600 flex items-center justify-center overflow-hidden">
              {adminProfile?.imageUrl ? (
                <Image
                  src={adminProfile.imageUrl}
                  alt={adminProfile?.name || 'Admin'}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-4xl sm:text-5xl font-bold text-white uppercase">
                  {adminProfile?.name?.charAt(0) || 'A'}
                </span>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                <ShieldCheck className="w-3.5 h-3.5" />
                {adminProfile?.role || 'Admin'}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                {adminProfile?.plan || 'Pro'} Plan
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {adminProfile?.status || 'Active'}
              </span>
            </div>
          </div>

          {/* Name & Headline */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {adminProfile?.name || 'MASUDUR RAHMAN'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
              <span>{adminProfile?.profession || 'App & Web Developer Specialist'}</span>
              {adminProfile?.companyName && (
                <>
                  <span>•</span>
                  <span className="text-indigo-600 font-medium">{adminProfile.companyName}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <User className="w-4 h-4 text-indigo-600" />
            Personal Details
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gray-50 text-gray-500">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Email Address</p>
                <p className="text-sm font-semibold text-gray-800">{adminProfile?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gray-50 text-gray-500">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-sm font-semibold text-gray-800">{adminProfile?.mobile || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gray-50 text-gray-500">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Address</p>
                <p className="text-sm font-semibold text-gray-800">
                  {adminProfile?.address || 'Dhaka, Bangladesh'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System & Professional Role Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            System Role & Professional Details
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gray-50 text-gray-500">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Company / Institute</p>
                <p className="text-sm font-semibold text-gray-800">
                  {adminProfile?.companyName || 'Ettehad'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gray-50 text-gray-500">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Profession</p>
                <p className="text-sm font-semibold text-gray-800">
                  {adminProfile?.profession || 'App & Web Developer Specialist'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gray-50 text-gray-500">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Account ID (UID)</p>
                <p className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                  {adminProfile?.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;