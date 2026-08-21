'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Trash2, ArrowLeft, X, Loader2 } from 'lucide-react';
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
const EXPENSES_COLLECTION = 'wallet_expenses';

const CATEGORIES = ['খাবার', 'শপিং', 'বাসা ভাড়া', 'বিল ও ইউটিলিটি', 'পরিবহন', 'চিকিৎসা', 'অন্যান্য'];

const formatMoney = (n) => `৳ ${(Number(n) || 0).toLocaleString('bn-BD')}`;
const sanitizeNonNegativeInput = (raw) => raw.replace(/-/g, '');
const todayStr = () => new Date().toISOString().split('T')[0];

export default function ExpenseHistoryPage() {
  const [accounts, setAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('all');

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('খাবার');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(todayStr());

  useEffect(() => {
    const unsubAccounts = onSnapshot(
      query(collection(db, ACCOUNTS_COLLECTION), orderBy('createdAt', 'desc')),
      (snap) => setAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubExpenses = onSnapshot(
      query(collection(db, EXPENSES_COLLECTION), orderBy('createdAt', 'desc')),
      (snap) => {
        setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('Expenses fetch error:', error);
        toast.error('খরচের তথ্য লোড করতে ব্যর্থ হয়েছে!');
        setLoading(false);
      }
    );

    return () => {
      unsubAccounts();
      unsubExpenses();
    };
  }, []);

  // ── নতুন খরচ যোগ — অ্যাটমিক: খরচ রেকর্ড + ব্যালেন্স কর্তন একসাথে ──
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      toast.warning('খরচের বিবরণ দিন!');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.warning('সঠিক পরিমাণ লিখুন!');
      return;
    }
    if (!accountId) {
      toast.warning('একটি খাত নির্বাচন করুন!');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('খরচ সংরক্ষণ করা হচ্ছে...');

    try {
      const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
      let accountName = '';

      await runTransaction(db, async (transaction) => {
        const accDoc = await transaction.get(accountRef);
        if (!accDoc.exists()) {
          throw new Error('খাতটি পাওয়া যায়নি!');
        }
        const currentBalance = Number(accDoc.data().balance) || 0;
        accountName = accDoc.data().name;

        transaction.update(accountRef, { balance: currentBalance - parsedAmount });

        const newExpenseRef = doc(collection(db, EXPENSES_COLLECTION));
        transaction.set(newExpenseRef, {
          accountId,
          accountName,
          title: title.trim(),
          amount: parsedAmount,
          category,
          date,
          createdAt: serverTimestamp(),
        });
      });

      toast.success('খরচ সফলভাবে যোগ হয়েছে!', { id: toastId });
      setTitle('');
      setAmount('');
      setAccountId('');
      setCategory('খাবার');
      setDate(todayStr());
      setShowModal(false);
    } catch (error) {
      console.error('Add expense error:', error);
      toast.error(error.message || 'খরচ যোগ করতে সমস্যা হয়েছে!', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // ── খরচ ডিলিট — ব্যালেন্স ফেরত (অ্যাটমিক) ──
  const handleDeleteExpense = async (expense) => {
    if (!confirm(`"${expense.title}" খরচের রেকর্ডটি মুছে ফেলবেন? টাকাটি সংশ্লিষ্ট খাতে ফেরত যোগ হবে।`)) return;

    const toastId = toast.loading('মুছে ফেলা হচ্ছে...');
    try {
      const accountRef = doc(db, ACCOUNTS_COLLECTION, expense.accountId);
      const expenseRef = doc(db, EXPENSES_COLLECTION, expense.id);

      await runTransaction(db, async (transaction) => {
        const accDoc = await transaction.get(accountRef);
        if (accDoc.exists()) {
          const currentBalance = Number(accDoc.data().balance) || 0;
          transaction.update(accountRef, { balance: currentBalance + expense.amount });
        }
        transaction.delete(expenseRef);
      });

      toast.success('খরচ মুছে ফেলা হয়েছে এবং ব্যালেন্স ফেরত দেওয়া হয়েছে!', { id: toastId });
    } catch (error) {
      console.error('Delete expense error:', error);
      toast.error('মুছতে সমস্যা হয়েছে!', { id: toastId });
    }
  };

  // ── সময়ভিত্তিক ফিল্টার ──
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (filterPeriod === 'all') return true;

      const expDate = new Date(exp.date);
      const today = new Date();
      expDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (filterPeriod === 'day') return expDate.getTime() === today.getTime();
      if (filterPeriod === 'week') {
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        return expDate >= oneWeekAgo && expDate <= today;
      }
      if (filterPeriod === 'month') {
        return expDate.getMonth() === today.getMonth() && expDate.getFullYear() === today.getFullYear();
      }
      if (filterPeriod === 'year') return expDate.getFullYear() === today.getFullYear();
      return true;
    });
  }, [expenses, filterPeriod]);

  const totalFilteredExpense = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/90">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>খরচের তথ্য লোড হচ্ছে...</span>
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

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">ব্যয়ের ইতিহাস (Expense History)</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ফিল্টার করা খরচের মোট পরিমাণ:{' '}
              <span className="font-bold text-rose-500 text-sm">{formatMoney(totalFilteredExpense)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: 'all', label: 'সব' },
                { id: 'day', label: 'আজ' },
                { id: 'week', label: 'সপ্তাহ' },
                { id: 'month', label: 'মাস' },
                { id: 'year', label: 'বছর' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setFilterPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterPeriod === p.id
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowModal(true)}
              disabled={accounts.length === 0}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> নতুন খরচ
            </button>
          </div>
        </div>

        {accounts.length === 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs p-3 rounded-xl">
            খরচ যোগ করতে আগে ওয়ালেট ও খাত পেজ থেকে অন্তত একটি খাত তৈরি করুন।
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700 text-xs">
                  <th className="p-4 font-semibold">বিবরণ</th>
                  <th className="p-4 font-semibold">ক্যাটাগরি</th>
                  <th className="p-4 font-semibold">খাত (Account)</th>
                  <th className="p-4 font-semibold">তারিখ</th>
                  <th className="p-4 font-semibold text-right">পরিমাণ (৳)</th>
                  <th className="p-4 font-semibold text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 text-xs">
                      কোনো খরচের রেকর্ড পাওয়া যায়নি!
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const acc = accounts.find((a) => a.id === exp.accountId);
                    return (
                      <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="p-4 font-bold text-gray-900 dark:text-white">{exp.title}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                          {acc ? acc.name : exp.accountName || 'অজ্ঞাত খাত'}
                        </td>
                        <td className="p-4 text-xs text-gray-400">{exp.date}</td>
                        <td className="p-4 font-extrabold text-right text-rose-500">- {formatMoney(exp.amount)}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteExpense(exp)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Expense */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-100 dark:border-gray-700 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">নতুন খরচ এন্ট্রি করুন</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">বিবরণ</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    placeholder="যেমন: বাজার খরচ / বিল"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">পরিমাণ (৳)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(sanitizeNonNegativeInput(e.target.value))}
                      className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">ক্যাটাগরি</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-rose-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">খাত সিলেক্ট করুন</label>
                  <select
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-rose-500"
                  >
                    <option value="">সিলেক্ট করুন</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (অবশিষ্ট: {formatMoney(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 disabled:bg-gray-300 text-white text-xs sm:text-sm font-semibold hover:bg-rose-700 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    যোগ করুন
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