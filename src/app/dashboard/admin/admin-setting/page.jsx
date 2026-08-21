'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  User,
  Shield,
  Bell,
  Save,
  KeyRound,
  Building2,
  Briefcase,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

const AdminSetting = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Profile Form States
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    mobile: '',
    profession: '',
    companyName: '',
  });

  // Password States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
          const data = userDoc.data();
          setProfileData({
            name: data.name || '',
            email: data.email || user.email || '',
            mobile: data.mobile || '',
            profession: data.profession || '',
            companyName: data.companyName || '',
          });
        } else {
          alert('আপনার এই পেজে ঢোকার অনুমতি নেই!');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Settings Fetch Error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Handle Profile Form Submit
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, 'MASUDUR_RAHMAN_DATABASE', currentUser.uid);
        await updateDoc(userRef, {
          name: profileData.name,
          mobile: profileData.mobile,
          profession: profileData.profession,
          companyName: profileData.companyName,
          updatedAt: new Date().toISOString(),
        });
        setSuccessMsg('প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!');
      }
    } catch (error) {
      console.error('Update Error:', error);
      alert('তথ্য আপডেট করতে সমস্যা হয়েছে!');
    } finally {
      setSaving(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!');
      return;
    }
    if (newPassword.length < 6) {
      alert('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে!');
      return;
    }

    setSaving(true);
    setSuccessMsg('');

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updatePassword(currentUser, newPassword);
        setSuccessMsg('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Password Update Error:', error);
      alert('পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে! পুনরায় লগইন করে চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-600 font-medium">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>সেটিংস লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
      {/* Header Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Admin Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          আপনার অ্যাকাউন্ট কনফিগারেশন এবং নিরাপত্তা সেটিংস পরিচালনা করুন
        </p>
      </div>

      {/* Success Alert Banner */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-3 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 mb-8 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('profile');
            setSuccessMsg('');
          }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <User className="w-4 h-4" />
          প্রোফাইল সেটিংস
        </button>

        <button
          onClick={() => {
            setActiveTab('security');
            setSuccessMsg('');
          }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          সিকিউরিটি ও পাসওয়ার্ড
        </button>
      </div>

      {/* Profile Settings Form */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  সম্পূর্ণ নাম
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  ইমেইল (পরিবর্তনযোগ্য নয়)
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={profileData.email}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  মোবাইল নম্বর
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profileData.mobile}
                    onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Profession */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  পেশা
                </label>
                <div className="relative">
                  <Briefcase className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profileData.profession}
                    onChange={(e) => setProfileData({ ...profileData, profession: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Company */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  কোম্পানি / প্রতিষ্ঠান
                </label>
                <div className="relative">
                  <Building2 className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profileData.companyName}
                    onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>সেভ করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 max-w-2xl">
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                নতুন পাসওয়ার্ড
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                কনফার্ম নতুন পাসওয়ার্ড
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                <span>পাসওয়ার্ড আপডেট করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default AdminSetting;