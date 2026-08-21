'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/auth-service';
import {
  Home,
  User,
  Utensils,
  BookOpen,
  Wallet,
  Settings,
  BarChart2,
  Users,
  BookOpenCheck,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Crown,
  Building2,
  MapPin,
  MailOpen,
  Loader2,
} from 'lucide-react';

const adminNavLinks = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Profile', href: '/dashboard/admin', icon: User },
  { name: 'Thali Katha', href: '/dashboard/admin/admin-thali-khata', icon: Utensils },
  { name: 'School Stationary', href: '/dashboard/admin/admin-school-stationary', icon: BookOpen },
  { name: 'My Wallet', href: '/dashboard/admin/admin-my-wallet', icon: Wallet },
  { name: 'User Management', href: '/dashboard/admin/admin-user-management', icon: Users },
  { name: 'Date Dairy', href: '/dashboard/admin/admin-date-dairy', icon: BookOpenCheck },
  { name: 'Analytics', href: '/dashboard/admin/admin-analytics', icon: BarChart2 },
  { name: 'Subscribe Email', href: '/dashboard/admin/user-subscribe-email', icon: MailOpen },
  { name: 'Settings', href: '/dashboard/admin/admin-setting', icon: Settings },
];

const userNavLinks = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Profile', href: '/dashboard/user', icon: User },
];

const moderatorNavLinks = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Profile', href: '/dashboard/moderator', icon: User },
  { name: 'Settings', href: '/dashboard/moderator/moderator-setting', icon: Settings },
];

const navLinksMap = {
  admin: adminNavLinks,
  user: userNavLinks,
  moderator: moderatorNavLinks,
};

// Role Configurations for Themes & Badges
const ROLE_CONFIGS = {
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    badgeBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    activeNavBg: 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm',
    activeIcon: 'text-indigo-600',
    activeBorder: 'border-indigo-500',
    avatarBg: 'bg-indigo-600',
    brandIconBg: 'bg-indigo-50 text-indigo-600',
    accentBar: 'bg-indigo-600',
    hoverBg: 'hover:bg-indigo-50 hover:text-indigo-700',
    hoverIcon: 'hover:text-indigo-600',
  },
  moderator: {
    label: 'Moderator',
    icon: ShieldAlert,
    badgeBg: 'bg-amber-100 text-amber-700 border-amber-200',
    activeNavBg: 'bg-amber-50 text-amber-700 font-semibold shadow-sm',
    activeIcon: 'text-amber-600',
    activeBorder: 'border-amber-500',
    avatarBg: 'bg-amber-600',
    brandIconBg: 'bg-amber-50 text-amber-600',
    accentBar: 'bg-amber-600',
    hoverBg: 'hover:bg-amber-50 hover:text-amber-700',
    hoverIcon: 'hover:text-amber-600',
  },
  user: {
    label: 'User',
    icon: UserCheck,
    badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    activeNavBg: 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm',
    activeIcon: 'text-emerald-600',
    activeBorder: 'border-emerald-500',
    avatarBg: 'bg-emerald-600',
    brandIconBg: 'bg-emerald-50 text-emerald-600',
    accentBar: 'bg-emerald-600',
    hoverBg: 'hover:bg-emerald-50 hover:text-emerald-700',
    hoverIcon: 'hover:text-emerald-600',
  },
};

const DashboardSidebar = ({ userProfile, loading = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // User Role Resolution
  const rawRole = (userProfile?.role || 'user').toLowerCase();
  const currentRole = ROLE_CONFIGS[rawRole] ? rawRole : 'user';
  const theme = ROLE_CONFIGS[currentRole];
  const RoleIcon = theme.icon;
  const navItems = navLinksMap[currentRole] || userNavLinks;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutUser();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm w-full">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${theme.brandIconBg}`}>
            <RoleIcon className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-800 text-base">Dashboard</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Role-ভিত্তিক Accent Bar */}
        <div className={`h-1 w-full ${theme.accentBar} shrink-0`} />

        {/* Brand Header (Desktop) */}
        <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className={`p-2.5 rounded-xl ${theme.brandIconBg}`}>
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-gray-800 tracking-wide text-sm truncate">Dashboard</h2>
            <p className="text-xs text-gray-400 capitalize">{currentRole} Portal</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3 shrink-0">
          <div className="flex items-center gap-3 px-1">
            <div className="relative w-10 h-10 flex-shrink-0">
              {userProfile?.imageUrl ? (
                <Image
                  src={userProfile.imageUrl}
                  alt={userProfile?.name || 'User'}
                  fill
                  className="rounded-full object-cover border border-gray-200 shadow-sm"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full ${theme.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-sm`}
                >
                  {userProfile?.name?.charAt(0)?.toUpperCase() || 'M'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {userProfile?.name || 'MASUDUR RAHMAN'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userProfile?.email || 'mrrana80226@gmail.com'}
              </p>
            </div>
          </div>

          {/* Address Line (If Available) */}
          {userProfile?.address && (
            <div className="flex items-center gap-1.5 px-1 text-[11px] text-gray-500 truncate">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
              <span className="truncate">{userProfile.address}</span>
            </div>
          )}

          {/* Role & Plan Badges */}
          <div className="flex items-center gap-2 px-1">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${theme.badgeBg}`}
            >
              <RoleIcon className="w-3 h-3" />
              {userProfile?.role || 'Admin'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 capitalize">
              <Crown className="w-3 h-3 text-amber-500" />
              {userProfile?.plan || 'Free'} Plan
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${
                  isActive ? theme.activeNavBg : `text-gray-600 ${theme.hoverBg}`
                }`}
              >
                {isActive && (
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${theme.activeBorder}`}
                  />
                )}
                <Icon className={`w-5 h-5 ${isActive ? theme.activeIcon : `text-gray-400 ${theme.hoverIcon}`}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
          >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
        />
      )}
    </>
  );
};

export default DashboardSidebar;