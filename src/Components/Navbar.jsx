"use client";

import { useState, useEffect } from "react";
import {
  Menu, X, Home, Code, GraduationCap,
  FolderKanban, Mail, BookOpen, LayoutDashboard, LogOut, UserKey
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: Home },
  { name: "TechStack", href: "/techStack", icon: Code },
  { name: "Experience", href: "/experience", icon: GraduationCap },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Contact Me", href: "/contact", icon: Mail },
  { name: "Blog", href: "/blog", icon: BookOpen },
];

const dashboardLinks = {
  user: '/dashboard/user',
  moderator: '/dashboard/moderator',
  admin: '/dashboard/admin'
};

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  
  const pathname = usePathname();
  const router = useRouter();

  // ১. ফায়ারবেস Auth এবং Firestore থেকে ইউজারের রোল পর্যবেক্ষণ করা
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        try {
          const userDocRef = doc(db, 'MASUDUR_RAHMAN_DATABASE', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'user');
          } else {
            setUserRole('user');
          }
        } catch (error) {
          console.error("User role fetch error:", error);
          setUserRole('user');
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // ২. সাইন আউট হ্যান্ডলার
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  if (pathname.includes('/dashboard')) {
    return null;
  }

  // ডাইনামিক ড্যাশবোর্ড পাথ নির্ধারণ
  const dashboardHref = dashboardLinks[userRole] || '/dashboard/user';

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Name */}
          <div className="flex items-center gap-3">
            <Image
              src="/masud-profile.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full object-cover border-2 border-blue-500"
            />
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              MASUDUR RAHMAN
            </h1>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    isActive ? "text-blue-400" : "text-gray-300 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href={dashboardHref}
                  className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md font-medium transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-sm bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md font-medium transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-md font-medium transition"
              >
                <UserKey className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-800 px-4 pt-2 pb-4 space-y-3 border-t border-slate-700">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                  isActive ? "text-blue-400 bg-slate-900" : "text-gray-300 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-700 flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 py-2 rounded-md text-sm font-medium"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full bg-red-600/20 text-red-400 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 py-2 rounded-md text-sm font-medium"
              >
                <UserKey className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;