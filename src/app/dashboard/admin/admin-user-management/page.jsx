'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

const UserManagementDashboard = () => {
  const router = useRouter();
  const [adminProfile, setAdminProfile] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

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
          setAdminProfile(userDoc.data());

          const querySnapshot = await getDocs(
            collection(db, 'MASUDUR_RAHMAN_DATABASE')
          );
          const users = querySnapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setUsersList(users);
        } else {
          alert('আপনার এই পেজে ঢোকার অনুমতি নেই!');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Admin Access Check Error:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Update Field Handler (Role, Status, Plan)
  const handleFieldUpdate = async (userId, field, newValue) => {
    setUpdatingId(userId);
    try {
      const userRef = doc(db, 'MASUDUR_RAHMAN_DATABASE', userId);
      await updateDoc(userRef, {
        [field]: newValue,
        updatedAt: new Date().toISOString(),
      });

      // Update Local State
      setUsersList((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, [field]: newValue } : user
        )
      );
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      alert('তথ্য আপডেট করতে সমস্যা হয়েছে!');
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (userId, userName) => {
    const confirmDelete = window.confirm(
      `আপনি কি নিশ্চিত যে "${userName}" ইউজারকে মুছে ফেলতে চান?`
    );

    if (!confirmDelete) return;

    setUpdatingId(userId);
    try {
      await deleteDoc(doc(db, 'MASUDUR_RAHMAN_DATABASE', userId));
      setUsersList((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('ইউজার ডিলিট করতে সমস্যা হয়েছে!');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            স্বাগতম, <span className="font-semibold text-gray-700">{adminProfile?.name || 'Admin'}</span>! এখানে আপনার সিস্টেমের সমস্ত তথ্য পরিচালনা করুন।
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
          ● Active Session
        </span>
      </div>

      {/* Main Users Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">নিবন্ধিত ইউজার তালিকা</h2>
            <p className="text-xs text-gray-500 mt-0.5">মোট ইউজার: {usersList.length} জন</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-medium">
                <th className="p-4 pl-6">নাম</th>
                <th className="p-4">ইমেইল</th>
                <th className="p-4">মোবাইল</th>
                <th className="p-4">পেশা</th>
                <th className="p-4">রোল</th>
                <th className="p-4">স্ট্যাটাস</th>
                <th className="p-4">প্ল্যান</th>
                <th className="p-4 pr-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6 font-semibold text-gray-800">{u.name}</td>
                  <td className="p-4 text-gray-600">{u.email}</td>
                  <td className="p-4 text-gray-600">{u.mobile}</td>
                  <td className="p-4 text-gray-600">{u.profession || 'N/A'}</td>

                  {/* Dynamic Role Dropdown */}
                  <td className="p-4">
                    <select
                      value={u.role || 'user'}
                      disabled={updatingId === u.id}
                      onChange={(e) => handleFieldUpdate(u.id, 'role', e.target.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        u.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : u.role === 'moderator'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                    </select>
                  </td>

                  {/* Dynamic Status Dropdown */}
                  <td className="p-4">
                    <select
                      value={u.status || 'active'}
                      disabled={updatingId === u.id}
                      onChange={(e) => handleFieldUpdate(u.id, 'status', e.target.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        u.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : u.status === 'block'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="block">Block</option>
                    </select>
                  </td>

                  {/* Dynamic Plan Dropdown */}
                  <td className="p-4">
                    <select
                      value={u.plan || 'free'}
                      disabled={updatingId === u.id}
                      onChange={(e) => handleFieldUpdate(u.id, 'plan', e.target.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border border-gray-200 outline-none uppercase transition-all ${
                        u.plan === 'pro'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                    </select>
                  </td>

                  {/* Delete Action Button */}
                  <td className="p-4 pr-6 text-center">
                    <button
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      disabled={updatingId === u.id}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                      title="ইউজার মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default UserManagementDashboard;