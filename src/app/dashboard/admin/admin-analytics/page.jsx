'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  ShieldCheck,
  Crown,
  TrendingUp,
  Loader2,
  BarChart2,
} from 'lucide-react';

const AdminAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    blockedUsers: 0,
    roles: { admin: 0, moderator: 0, user: 0 },
    plans: { free: 0, pro: 0 },
  });

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, 'MASUDUR_RAHMAN_DATABASE')
        );
        const users = querySnapshot.docs.map((doc) => doc.data());

        const analytics = users.reduce(
          (acc, user) => {
            acc.totalUsers += 1;

            // Status counts
            if (user.status === 'active') acc.activeUsers += 1;
            else if (user.status === 'pending') acc.pendingUsers += 1;
            else if (user.status === 'block') acc.blockedUsers += 1;

            // Role counts
            const role = (user.role || 'user').toLowerCase();
            if (acc.roles[role] !== undefined) acc.roles[role] += 1;
            else acc.roles.user += 1;

            // Plan counts
            const plan = (user.plan || 'free').toLowerCase();
            if (acc.plans[plan] !== undefined) acc.plans[plan] += 1;
            else acc.plans.free += 1;

            return acc;
          },
          {
            totalUsers: 0,
            activeUsers: 0,
            pendingUsers: 0,
            blockedUsers: 0,
            roles: { admin: 0, moderator: 0, user: 0 },
            plans: { free: 0, pro: 0 },
          }
        );

        setStats(analytics);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-600 font-medium">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>অ্যানালিটিক্স ডাটা লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  // Calculate Percentages for Visual Progress Bars
  const getPercentage = (value) =>
    stats.totalUsers > 0 ? Math.round((value / stats.totalUsers) * 100) : 0;

  return (
    <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header Title */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-indigo-600" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            সিস্টেমের ইউজার অ্যাক্টিভিটি এবং সামগ্রিক ডাটার অ্যানালিটিক্স
          </p>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">মোট ইউজার</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalUsers}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">একটিভ ইউজার</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.activeUsers}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">পেন্ডিং রিকোয়েস্ট</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingUsers}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Blocked Users */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">ব্লকড ইউজার</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{stats.blockedUsers}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Role Breakdown Progress */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            ইউজার রোল বিশ্লেষণ (Roles Breakdown)
          </h2>

          <div className="space-y-5">
            {/* Admin */}
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                <span>Admin ({stats.roles.admin})</span>
                <span>{getPercentage(stats.roles.admin)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${getPercentage(stats.roles.admin)}%` }}
                />
              </div>
            </div>

            {/* Moderator */}
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                <span>Moderator ({stats.roles.moderator})</span>
                <span>{getPercentage(stats.roles.moderator)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${getPercentage(stats.roles.moderator)}%` }}
                />
              </div>
            </div>

            {/* General User */}
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                <span>General User ({stats.roles.user})</span>
                <span>{getPercentage(stats.roles.user)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${getPercentage(stats.roles.user)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plan Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Crown className="w-5 h-5 text-amber-500" />
            সাবস্ক্রিপশন প্ল্যান ডিস্ট্রিবিউশন
          </h2>

          <div className="space-y-5">
            {/* Free Plan */}
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                <span>Free Plan ({stats.plans.free})</span>
                <span>{getPercentage(stats.plans.free)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 transition-all duration-500"
                  style={{ width: `${getPercentage(stats.plans.free)}%` }}
                />
              </div>
            </div>

            {/* Pro Plan */}
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                <span>Pro Plan ({stats.plans.pro})</span>
                <span>{getPercentage(stats.plans.pro)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                  style={{ width: `${getPercentage(stats.plans.pro)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ratio Summary Card */}
          <div className="mt-8 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <p className="text-xs text-indigo-900 font-medium">
                একটিভ ইউজার এনগেজমেন্ট রেট:
              </p>
            </div>
            <span className="text-sm font-bold text-indigo-700">
              {getPercentage(stats.activeUsers)}%
            </span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminAnalyticsDashboard;