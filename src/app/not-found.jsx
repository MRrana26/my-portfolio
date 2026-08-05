"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NotFound = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // ✅ টাইমার useEffect-এর ভিতরে শুরু করুন, রেন্ডারের সময় নয়
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // ✅ ক্লিনআপ ফাংশন
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          পেজটি পাওয়া যায়নি
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {countdown > 0 ? (
            <>আপনাকে হোম পেজে নিয়ে যাচ্ছি {countdown} সেকেন্ডের মধ্যে...</>
          ) : (
            'রিডাইরেক্ট হচ্ছে...'
          )}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          হোম পেজে যান
        </Link>
      </div>
    </div>
  );
};

export default NotFound;