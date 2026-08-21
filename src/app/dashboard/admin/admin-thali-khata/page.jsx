'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Plus,
  ArrowLeft,
  MoreVertical,
  Phone,
  FileText,
  Copy,
  Share2,
  Check,
  X,
  Search,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

const CUSTOMERS_COLLECTION = 'tali_customers';
const TRANSACTIONS_COLLECTION = 'tali_transactions';

const AVATAR_COLORS = [
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
];

const getAvatarStyle = (name = '') => {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

const formatMoney = (n) => `৳ ${Math.abs(Number(n) || 0).toLocaleString('bn-BD')}`;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ── Pure-render ফিক্স: "এখন" সময়টা state-এ রাখা হয়, প্রতি মিনিটে আপডেট হয় ──
// render() নিজে কখনো Date.now() কল করে না — শুধু এই state পড়ে, তাই render idempotent থাকে
const useNow = (refreshMs = 60000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), refreshMs);
    return () => clearInterval(intervalId);
  }, [refreshMs]);
  return now;
};

// ── formatTime এখন "now" প্যারামিটার নেয়, নিজে Date.now() কল করে না (pure) ──
const formatTimeAgo = (timestamp, now) => {
  if (!timestamp) return '';
  const date = timestamp.toDate?.() || new Date(timestamp);
  const diff = Math.floor((now - date.getTime()) / 1000);
  if (diff < 60) return `${diff} সেকেন্ড আগে`;
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} দিন আগে`;
  return date.toLocaleDateString('bn-BD');
};

const TaliKhata = () => {
  const now = useNow();

  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [customerForm, setCustomerForm] = useState({ name: '', address: '', phone: '' });
  const [txForm, setTxForm] = useState({
    givenAmount: '',
    receivedAmount: '',
    description: '',
    date: todayStr(),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubCustomers = onSnapshot(
      query(collection(db, CUSTOMERS_COLLECTION), orderBy('name')),
      (snap) => setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // setLoading(false) এখানে onSnapshot-এর callback-এ কল হচ্ছে (external subscription
    // থেকে আসা ইভেন্টে) — effect body-তে সরাসরি না, তাই React-এর নিয়ম অনুযায়ী বৈধ
    const unsubTransactions = onSnapshot(
      query(collection(db, TRANSACTIONS_COLLECTION), orderBy('createdAt', 'desc')),
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );

    return () => {
      unsubCustomers();
      unsubTransactions();
    };
  }, []);

  const customerStats = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      if (!map[tx.customerId]) {
        map[tx.customerId] = { balance: 0, lastTx: null };
      }
      map[tx.customerId].balance += tx.type === 'due' ? tx.amount : -tx.amount;
      const current = map[tx.customerId].lastTx;
      const currentMs = current?.createdAt?.toMillis?.() || 0;
      const txMs = tx.createdAt?.toMillis?.() || 0;
      if (!current || txMs > currentMs) {
        map[tx.customerId].lastTx = tx;
      }
    });
    return map;
  }, [transactions]);

  const getBalance = (customerId) => customerStats[customerId]?.balance || 0;
  const getLastTx = (customerId) => customerStats[customerId]?.lastTx || null;

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.trim().toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone?.includes(q));
  }, [customers, searchQuery]);

  const totalReceivable = customers.reduce((sum, c) => {
    const b = getBalance(c.id);
    return sum + (b > 0 ? b : 0);
  }, 0);

  const totalPayable = customers.reduce((sum, c) => {
    const b = getBalance(c.id);
    return sum + (b < 0 ? Math.abs(b) : 0);
  }, 0);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name.trim()) {
      toast.warning('নাম দিতে হবে!');
      return;
    }

    const toastId = toast.loading('গ্রাহক যোগ করা হচ্ছে...');
    try {
      await addDoc(collection(db, CUSTOMERS_COLLECTION), {
        name: customerForm.name.trim(),
        address: customerForm.address.trim(),
        phone: customerForm.phone.trim(),
        createdAt: serverTimestamp(),
      });
      toast.success('গ্রাহক যোগ হয়েছে!', { id: toastId });
      setCustomerForm({ name: '', address: '', phone: '' });
      setShowAddCustomer(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('যোগ করতে সমস্যা হয়েছে!', { id: toastId });
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const given = Number(txForm.givenAmount) || 0;
    const received = Number(txForm.receivedAmount) || 0;

    if (given <= 0 && received <= 0) {
      toast.warning('দিলাম বা পেলাম — অন্তত একটি ঘরে পরিমাণ লিখুন!');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('লেনদেন সংরক্ষণ করা হচ্ছে...');

    try {
      const entries = [];
      if (given > 0) entries.push({ type: 'due', amount: given });
      if (received > 0) entries.push({ type: 'receive', amount: received });

      let lastSaved = null;
      let runningBalance = getBalance(selectedCustomer.id);

      for (const entry of entries) {
        const newTx = {
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          type: entry.type,
          amount: entry.amount,
          description: txForm.description.trim(),
          date: txForm.date,
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), newTx);
        runningBalance += entry.type === 'due' ? entry.amount : -entry.amount;
        lastSaved = { ...newTx, id: docRef.id, balanceAfter: runningBalance };
      }

      toast.success('লেনদেন সফলভাবে সংরক্ষণ হয়েছে!', { id: toastId });
      setLastTransaction(lastSaved);
      setShowInvoice(true);
      setTxForm({ givenAmount: '', receivedAmount: '', description: '', date: todayStr() });
    } catch (error) {
      console.error('Error:', error);
      toast.error('লেনদেন যোগ করতে সমস্যা হয়েছে!', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    const toastId = toast.loading('মুছে ফেলা হচ্ছে...');
    try {
      await deleteDoc(doc(db, CUSTOMERS_COLLECTION, customerId));
      toast.success('গ্রাহক মুছে ফেলা হয়েছে', { id: toastId });
    } catch (error) {
      console.error('Error:', error);
      toast.error('মুছতে সমস্যা হয়েছে!', { id: toastId });
    }
  };

  const buildInvoiceText = () => {
    if (!lastTransaction) return '';
    return [
      'লেনদেনটি রেকর্ড করা হয়েছে',
      '',
      lastTransaction.customerName,
      '',
      `ধরন: ${lastTransaction.type === 'due' ? '📤 দিলাম' : '📥 পেলাম'}`,
      `পরিমাণ: ${formatMoney(lastTransaction.amount)}`,
      `তারিখ: ${lastTransaction.date}`,
      `বর্তমান ব্যালেন্স: ${formatMoney(lastTransaction.balanceAfter)} (${
        lastTransaction.balanceAfter >= 0 ? 'পাবো' : 'দেবো'
      })`,
      lastTransaction.description ? `বিবরণ: ${lastTransaction.description}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  const handleCopyInvoice = async () => {
    try {
      await copyText(buildInvoiceText());
      setCopied(true);
      toast.success('কপি হয়েছে!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('কপি করতে সমস্যা হয়েছে!');
    }
  };

  const handleShareInvoice = async () => {
    const text = buildInvoiceText();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'লেনদেনের রসিদ', text });
      } catch (error) {
        if (error.name !== 'AbortError') toast.error('শেয়ার করতে সমস্যা হয়েছে!');
      }
    } else {
      await handleCopyInvoice();
      toast.info('শেয়ার সাপোর্ট নেই — রসিদ কপি হয়েছে, পেস্ট করে শেয়ার করুন।');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // ── ইনভয়েস মোডাল ──
  if (showInvoice && lastTransaction) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">লেনদেনটি রেকর্ড করা হয়েছে।</h2>
            <button
              onClick={() => {
                setShowInvoice(false);
                setLastTransaction(null);
                setCopied(false);
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 space-y-2">
            <div className="flex justify-between border-b border-dashed border-blue-200 pb-2">
              <span className="font-semibold">{lastTransaction.customerName}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-blue-200 pb-2">
              <span className="text-gray-500 text-sm">ধরন</span>
              <span className={`font-semibold ${lastTransaction.type === 'due' ? 'text-red-600' : 'text-green-600'}`}>
                {lastTransaction.type === 'due' ? '📤 দিলাম' : '📥 পেলাম'}
              </span>
            </div>
            <div className="flex justify-between border-b border-dashed border-blue-200 pb-2">
              <span className="text-gray-500 text-sm">পরিমাণ</span>
              <span className={`font-bold text-lg ${lastTransaction.type === 'due' ? 'text-red-600' : 'text-green-600'}`}>
                {formatMoney(lastTransaction.amount)}
              </span>
            </div>
            {lastTransaction.description && (
              <div className="flex justify-between border-b border-dashed border-blue-200 pb-2">
                <span className="text-gray-500 text-sm">বিবরণ</span>
                <span className="font-medium text-sm">{lastTransaction.description}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-dashed border-blue-200 pb-2">
              <span className="text-gray-500 text-sm">তারিখ</span>
              <span className="font-medium text-sm">{lastTransaction.date}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-gray-500 text-sm font-bold">বর্তমান: </span>
              <span className={`font-bold ${lastTransaction.balanceAfter >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatMoney(lastTransaction.balanceAfter)} ({lastTransaction.balanceAfter >= 0 ? 'পাবো' : 'দেবো'})
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCopyInvoice}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'কপি হয়েছে!' : 'কপি করুন'}
            </button>
            <button
              onClick={handleShareInvoice}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition"
            >
              <Share2 className="w-4 h-4" />
              শেয়ার করুন
            </button>
          </div>

          <button
            onClick={() => {
              setShowInvoice(false);
              setLastTransaction(null);
              setCopied(false);
            }}
            className="w-full mt-2 py-2 text-gray-500 text-sm hover:bg-gray-50 rounded-xl transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    );
  }

  // ── গ্রাহক ডিটেইল ভিউ ──
  if (selectedCustomer) {
    const balance = getBalance(selectedCustomer.id);
    const lastTx = getLastTx(selectedCustomer.id);
    const customerTxs = transactions.filter((tx) => tx.customerId === selectedCustomer.id).slice(0, 10);

    return (
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        <div className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 ml-3">
            <h2 className="font-bold text-lg">{selectedCustomer.name}</h2>
            {selectedCustomer.phone && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {selectedCustomer.phone}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              if (confirm(`${selectedCustomer.name} কে মুছে ফেলবেন?`)) {
                handleDeleteCustomer(selectedCustomer.id);
                setSelectedCustomer(null);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">ব্যালেন্স</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {balance >= 0 ? 'পাবো' : 'দেবো'} {formatMoney(balance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">সর্বশেষ লেনদেন</p>
              <p className="text-sm font-medium">{lastTx ? formatTimeAgo(lastTx.createdAt, now) : 'কোনো লেনদেন নেই'}</p>
            </div>
          </div>

          <Link
            href={`/dashboard/admin/admin-thali-khata/report?id=${selectedCustomer.id}`}
            className="mt-3 w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-100 transition"
          >
            <FileText className="w-4 h-4" />
            সম্পূর্ণ রিপোর্ট দেখুন
          </Link>
        </div>

        <div className="mx-4 mt-4 bg-white rounded-xl shadow-sm p-4">
          <form onSubmit={handleAddTransaction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">দিলাম / বেচা (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="৳ 0"
                  value={txForm.givenAmount}
                  onChange={(e) => setTxForm({ ...txForm, givenAmount: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-red-100 focus:border-red-300 rounded-xl text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">পেলাম (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="৳ 0"
                  value={txForm.receivedAmount}
                  onChange={(e) => setTxForm({ ...txForm, receivedAmount: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-100 focus:border-green-300 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>

            <input
              type="text"
              placeholder="বিবরণ (ঐচ্ছিক)"
              value={txForm.description}
              onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={txForm.date}
              onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              নিশ্চিত করুন
            </button>
          </form>
        </div>

        {customerTxs.length > 0 && (
          <div className="mx-4 mt-4 bg-white rounded-xl shadow-sm p-4 mb-6">
            <p className="text-xs font-bold text-gray-500 mb-2">সাম্প্রতিক লেনদেন</p>
            <div className="divide-y divide-gray-50">
              {customerTxs.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${tx.type === 'due' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'due' ? '📤 দিলাম' : '📥 পেলাম'} {formatMoney(tx.amount)}
                    </p>
                    {tx.description && <p className="text-xs text-gray-400">{tx.description}</p>}
                  </div>
                  <p className="text-xs text-gray-400">{tx.date || formatTimeAgo(tx.createdAt, now)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── হোম পেজ (গ্রাহক তালিকা) ──
  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 space-y-3">
        <h1 className="text-xl font-bold text-center">📒 ট্যালি খাতা</h1>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="নাম বা মোবাইল দিয়ে খুঁজুন"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">মোট পাবো</p>
          <p className="text-xl font-bold text-red-600">{formatMoney(totalReceivable)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">মোট দেবো</p>
          <p className="text-xl font-bold text-green-600">{formatMoney(totalPayable)}</p>
        </div>
      </div>

      <div className="px-4 pb-20">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-400">{searchQuery ? 'কোনো ফলাফল পাওয়া যায়নি' : 'কোনো গ্রাহক নেই'}</p>
            {!searchQuery && <p className="text-sm text-gray-300 mt-1">নতুন গ্রাহক যোগ করতে + বাটনে ক্লিক করুন</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCustomers.map((customer) => {
              const balance = getBalance(customer.id);
              const lastTx = getLastTx(customer.id);
              const avatarStyle = getAvatarStyle(customer.name);
              return (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className="w-full bg-white p-4 rounded-xl shadow-sm text-left hover:shadow-md transition flex items-center gap-3"
                >
                  <div
                    className={`w-11 h-11 shrink-0 rounded-full ${avatarStyle.bg} ${avatarStyle.text} flex items-center justify-center font-bold text-sm`}
                  >
                    {getInitials(customer.name)}
                  </div>
                  <div className="flex-1 min-w-0 flex justify-between items-center">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{customer.name}</p>
                      {customer.phone && <p className="text-xs text-gray-400">{customer.phone}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p
                        className={`font-bold text-sm ${
                          balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {balance === 0 ? '0.00' : formatMoney(balance)}
                      </p>
                      <p className="text-xs text-gray-400">{lastTx ? formatTimeAgo(lastTx.createdAt, now) : 'নতুন'}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowAddCustomer(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">নতুন গ্রাহক যোগ করুন</h2>
            <form onSubmit={handleAddCustomer} className="space-y-3">
              <input
                type="text"
                placeholder="নাম *"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="ঠিকানা (ঐচ্ছিক)"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomer(false);
                    setCustomerForm({ name: '', address: '', phone: '' });
                  }}
                  className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-medium"
                >
                  বাতিল
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium">
                  যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaliKhata;