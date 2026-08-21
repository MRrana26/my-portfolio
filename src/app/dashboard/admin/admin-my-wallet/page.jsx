'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  History,
  LayoutDashboard,
  Loader2,
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ACCOUNTS_COLLECTION = 'wallet_accounts';
const EXPENSES_COLLECTION = 'wallet_expenses';
const INCOMES_COLLECTION = 'wallet_incomes';

const formatMoney = (n) => `৳ ${(Number(n) || 0).toLocaleString('bn-BD')}`;

export default function WalletDashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [loadingIncomes, setLoadingIncomes] = useState(true);

  useEffect(() => {
    const unsubAccounts = onSnapshot(
      query(collection(db, ACCOUNTS_COLLECTION), orderBy('createdAt', 'desc')),
      (snap) => {
        setAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingAccounts(false);
      },
      () => setLoadingAccounts(false)
    );

    const unsubExpenses = onSnapshot(
      query(collection(db, EXPENSES_COLLECTION), orderBy('createdAt', 'desc')),
      (snap) => {
        setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingExpenses(false);
      },
      () => setLoadingExpenses(false)
    );

    const unsubIncomes = onSnapshot(
      query(collection(db, INCOMES_COLLECTION), orderBy('createdAt', 'desc')),
      (snap) => {
        setIncomes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingIncomes(false);
      },
      () => setLoadingIncomes(false)
    );

    return () => {
      unsubAccounts();
      unsubExpenses();
      unsubIncomes();
    };
  }, []);

  const loading = loadingAccounts || loadingExpenses || loadingIncomes;

  const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  const totalExpense = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const totalIncome = incomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/90">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>ফায়ারবেস থেকে ডেটা লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              পার্সোনাল ওয়ালেট ড্যাশবোর্ড
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              আপনার দৈনন্দিন জমা ও খরচের স্মার্ট ডিজিটাল হিসাব
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-200/60 dark:bg-gray-800 p-1.5 rounded-2xl">
            <Link
              href="/dashboard/admin/admin-my-wallet"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-xs"
            >
              <LayoutDashboard className="w-4 h-4" /> ড্যাশবোর্ড
            </Link>
            <Link
              href="/dashboard/admin/admin-my-wallet/account-balance"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900"
            >
              <CreditCard className="w-4 h-4" /> ওয়ালেট ও খাত
            </Link>
            <Link
              href="/dashboard/admin/admin-my-wallet/expense-history"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900"
            >
              <History className="w-4 h-4" /> খরচের ইতিহাস
            </Link>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-blue-100">মোট ব্যালেন্স</span>
              <Wallet className="w-5 h-5 text-blue-200" />
            </div>
            <h3 className="text-3xl font-black">{formatMoney(totalBalance)}</h3>
            <p className="text-xs text-blue-200">সকল খাতের মোট জমা টাকা</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">মোট আয় (Income)</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatMoney(totalIncome)}</h3>
            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" /> সর্বমোট প্রাপ্তি
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">মোট খরচ (Expense)</span>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-xl text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatMoney(totalExpense)}</h3>
            <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> সর্বমোট ব্যয়
            </p>
          </div>
        </div>

        {/* Quick Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">খাতসমূহ</h3>
              <Link
                href="/dashboard/admin/admin-my-wallet/account-balance"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                সবগুলো দেখুন
              </Link>
            </div>
            <div className="space-y-3">
              {accounts.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">কোনো খাত যুক্ত করা হয়নি</p>
              ) : (
                accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex justify-between items-center p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100/80 dark:border-gray-800"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{acc.name}</p>
                      <p className="text-xs text-gray-400">{acc.type}</p>
                    </div>
                    <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                      {formatMoney(acc.balance)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">সাম্প্রতিক খরচসমূহ</h3>
              <Link
                href="/dashboard/admin/admin-my-wallet/expense-history"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                বিস্তারিত দেখুন
              </Link>
            </div>

            <div className="space-y-3">
              {expenses.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">কোনো খরচ পাওয়া যায়নি</p>
              ) : (
                expenses.slice(0, 4).map((exp) => {
                  const acc = accounts.find((a) => a.id === exp.accountId);
                  return (
                    <div
                      key={exp.id}
                      className="flex justify-between items-center p-3.5 rounded-2xl bg-gray-50/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{exp.title}</p>
                          <p className="text-xs text-gray-400">
                            {exp.category} • {acc ? acc.name : 'অজানা খাত'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-rose-500">- {formatMoney(exp.amount)}</p>
                        <p className="text-xs text-gray-400">{exp.date}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}