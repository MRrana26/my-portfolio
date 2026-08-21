'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Wallet, Smartphone, Landmark, Trash2, ArrowLeft, X, Loader2 } from 'lucide-react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

const ACCOUNTS_COLLECTION = 'wallet_accounts';
const INCOMES_COLLECTION = 'wallet_incomes';

const ACCOUNT_TYPES = ['Cash', 'Mobile Banking', 'Bank'];

const formatMoney = (n) => `৳ ${(Number(n) || 0).toLocaleString('bn-BD')}`;
const sanitizeNonNegativeInput = (raw) => raw.replace(/-/g, '');

const getAccountIcon = (type) => {
  switch (type) {
    case 'Cash':
      return <Wallet className="w-5 h-5 text-emerald-500" />;
    case 'Mobile Banking':
      return <Smartphone className="w-5 h-5 text-pink-500" />;
    case 'Bank':
      return <Landmark className="w-5 h-5 text-blue-500" />;
    default:
      return <Wallet className="w-5 h-5 text-indigo-500" />;
  }
};

export default function AccountBalancePage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingIncome, setIsSavingIncome] = useState(false);

  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('Mobile Banking');
  const [initialBalance, setInitialBalance] = useState('');

  const [selectedAccId, setSelectedAccId] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, ACCOUNTS_COLLECTION), orderBy('createdAt', 'desc')),
      (snap) => {
        setAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('Accounts fetch error:', error);
        toast.error('খাত লোড করতে ব্যর্থ হয়েছে!');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── নতুন খাত/অ্যাকাউন্ট যোগ ──
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    const amount = parseFloat(initialBalance);
    if (!accName.trim()) {
      toast.warning('খাতের নাম দিন!');
      return;
    }
    if (isNaN(amount) || amount < 0) {
      toast.warning('সঠিক প্রাথমিক ব্যালেন্স দিন!');
      return;
    }

    setIsSavingAccount(true);
    const toastId = toast.loading('খাত তৈরি করা হচ্ছে...');
    try {
      await addDoc(collection(db, ACCOUNTS_COLLECTION), {
        name: accName.trim(),
        type: accType,
        balance: amount,
        createdAt: serverTimestamp(),
      });
      toast.success('নতুন খাত যোগ হয়েছে!', { id: toastId });
      setAccName('');
      setInitialBalance('');
      setAccType('Mobile Banking');
      setShowAccountModal(false);
    } catch (error) {
      console.error('Create account error:', error);
      toast.error('খাত তৈরি করতে সমস্যা হয়েছে!', { id: toastId });
    } finally {
      setIsSavingAccount(false);
    }
  };

  // ── টাকা জমা (Income) — অ্যাটমিক: ইনকাম রেকর্ড + ব্যালেন্স আপডেট একসাথে ──
  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(incomeAmount);
    if (!selectedAccId) {
      toast.warning('একটি খাত নির্বাচন করুন!');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.warning('সঠিক পরিমাণ লিখুন!');
      return;
    }

    setIsSavingIncome(true);
    const toastId = toast.loading('টাকা জমা করা হচ্ছে...');
    try {
      const accountRef = doc(db, ACCOUNTS_COLLECTION, selectedAccId);
      let accountName = '';

      await runTransaction(db, async (transaction) => {
        const accDoc = await transaction.get(accountRef);
        if (!accDoc.exists()) {
          throw new Error('খাতটি পাওয়া যায়নি!');
        }
        const currentBalance = Number(accDoc.data().balance) || 0;
        accountName = accDoc.data().name;

        transaction.update(accountRef, { balance: currentBalance + amount });

        const newIncomeRef = doc(collection(db, INCOMES_COLLECTION));
        transaction.set(newIncomeRef, {
          accountId: selectedAccId,
          accountName,
          amount,
          source: incomeSource.trim(),
          date: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp(),
        });
      });

      toast.success(`${accountName} খাতে ${formatMoney(amount)} জমা হয়েছে!`, { id: toastId });
      setSelectedAccId('');
      setIncomeAmount('');
      setIncomeSource('');
      setShowIncomeModal(false);
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error(error.message || 'জমা করতে সমস্যা হয়েছে!', { id: toastId });
    } finally {
      setIsSavingIncome(false);
    }
  };

  const handleDeleteAccount = async (id, name) => {
    if (!confirm(`"${name}" খাতটি মুছে ফেলবেন? এর সাথে যুক্ত আয়/খরচের রেকর্ড এখানে থেকে যাবে।`)) return;

    const toastId = toast.loading('খাত মুছে ফেলা হচ্ছে...');
    try {
      await deleteDoc(doc(db, ACCOUNTS_COLLECTION, id));
      toast.success('খাত মুছে ফেলা হয়েছে', { id: toastId });
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('মুছতে সমস্যা হয়েছে!', { id: toastId });
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/90">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>খাতসমূহ লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href="/dashboard/admin/admin-my-wallet"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> ড্যাশবোর্ডে ফিরে যান
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">আমার ওয়ালেট ও অ্যাকাউন্টসমূহ</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              সর্বমোট ব্যালেন্স:{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatMoney(totalBalance)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowIncomeModal(true)}
              disabled={accounts.length === 0}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> টাকা জমা (Income)
            </button>
            <button
              onClick={() => setShowAccountModal(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> নতুন খাত যোগ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center text-gray-400 text-sm">
              এখনো কোনো খাত যোগ করা হয়নি। নতুন খাত যোগ বাটনে ক্লিক করে শুরু করুন।
            </div>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">{getAccountIcon(acc.type)}</div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">{acc.name}</h3>
                      <span className="text-xs font-medium text-gray-400">{acc.type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAccount(acc.id, acc.name)}
                    className="text-gray-400 hover:text-red-500 p-1.5 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex justify-between items-baseline">
                  <span className="text-xs text-gray-500 dark:text-gray-400">বর্তমান ব্যালেন্স:</span>
                  <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                    {formatMoney(acc.balance)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: New Account */}
        {showAccountModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-100 dark:border-gray-700 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">নতুন খাত যোগ করুন</h3>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">খাতের নাম</label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    placeholder="যেমন: বিকাশ / ডাচ বাংলা ব্যাংক"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">খাতের ধরন</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Cash">Cash (নগদ)</option>
                    <option value="Mobile Banking">Mobile Banking (বিকাশ/রকেট/নগদ)</option>
                    <option value="Bank">Bank (ব্যাংক)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">প্রাথমিক ব্যালেন্স (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(sanitizeNonNegativeInput(e.target.value))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAccount}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 disabled:bg-gray-300 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSavingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                    সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Deposit Money */}
        {showIncomeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-100 dark:border-gray-700 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">টাকা জমা করুন (Income)</h3>
                <button
                  onClick={() => setShowIncomeModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">খাত নির্বাচন করুন</label>
                  <select
                    required
                    value={selectedAccId}
                    onChange={(e) => setSelectedAccId(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">সিলেক্ট করুন</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (বর্তমান: {formatMoney(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">টাকার পরিমাণ (৳)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(sanitizeNonNegativeInput(e.target.value))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">উৎস/বিবরণ</label>
                  <input
                    type="text"
                    maxLength={80}
                    placeholder="যেমন: বেতন / ফ্রিল্যান্সিং"
                    value={incomeSource}
                    onChange={(e) => setIncomeSource(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIncomeModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingIncome}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 disabled:bg-gray-300 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSavingIncome && <Loader2 className="w-4 h-4 animate-spin" />}
                    জমা দিন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}