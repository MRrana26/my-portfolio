'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Printer,
  Copy,
  Check,
  User,
  FileText,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const TRANSACTIONS_COLLECTION = 'tali_transactions';
const CUSTOMERS_COLLECTION = 'tali_customers';

const formatMoney = (n) => `৳ ${Math.abs(Number(n) || 0).toLocaleString('bn-BD')}`;

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate?.() || new Date(timestamp);
  return date.toLocaleString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ReportContent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  // ── ফিক্স: id প্রথম রেন্ডারেই জানা যায় (client-side), তাই initial state-এই ঠিক
  // মান বসিয়ে দিলে effect body-তে সরাসরি setState(false) কল করার দরকার নেই ──
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(!!id);
  const [copied, setCopied] = useState(false);

  // ── ফিক্স: "রিপোর্ট তৈরির সময়" একবারই effect-এ সেট হয় (mount হওয়ার মুহূর্তে),
  // render-এ সরাসরি new Date() কল হয় না — তাই render pure থাকে ──
  const [generatedAt, setGeneratedAt] = useState(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGeneratedAt(new Date());
  }, []);

  useEffect(() => {
    if (!id) return;

    const loadCustomer = async () => {
      try {
        const docSnap = await getDoc(doc(db, CUSTOMERS_COLLECTION, id));
        if (docSnap.exists()) setCustomer({ id: docSnap.id, ...docSnap.data() });
      } catch (error) {
        console.error('Error loading customer:', error);
      }
    };
    loadCustomer();

    // orderBy বাদ দেওয়া হয়েছে composite index এড়াতে — নিচে ক্লায়েন্ট-সাইডে সর্ট করা হয়
    const q = query(collection(db, TRANSACTIONS_COLLECTION), where('customerId', '==', id));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => {
          const aMs = a.createdAt?.toMillis?.() || 0;
          const bMs = b.createdAt?.toMillis?.() || 0;
          return bMs - aMs;
        });
        setTransactions(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading transactions:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  const balance = transactions.reduce((acc, tx) => acc + (tx.type === 'due' ? tx.amount : -tx.amount), 0);
  const totalDue = transactions.filter((t) => t.type === 'due').reduce((a, t) => a + t.amount, 0);
  const totalReceive = transactions.filter((t) => t.type === 'receive').reduce((a, t) => a + t.amount, 0);

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

  const handleCopyReport = async () => {
    if (!customer) return;
    const reportText = [
      '📊 লেনদেন রিপোর্ট',
      '━━━━━━━━━━━━━━━━━━',
      `গ্রাহক: ${customer.name}`,
      customer.phone ? `ফোন: ${customer.phone}` : '',
      customer.address ? `ঠিকানা: ${customer.address}` : '',
      '━━━━━━━━━━━━━━━━━━',
      `মোট লেনদেন: ${transactions.length} টি`,
      `মোট দেওয়া: ${formatMoney(totalDue)}`,
      `মোট পাওয়া: ${formatMoney(totalReceive)}`,
      `বর্তমান ব্যালেন্স: ${formatMoney(balance)} (${balance >= 0 ? 'পাবো' : 'দেবো'})`,
      '━━━━━━━━━━━━━━━━━━',
      ...transactions.map(
        (tx, i) =>
          `${i + 1}. ${formatDate(tx.createdAt)} - ${tx.type === 'due' ? '📤 দিলাম' : '📥 পেলাম'} ${formatMoney(
            tx.amount
          )}${tx.description ? ` (${tx.description})` : ''}`
      ),
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await copyText(reportText);
      setCopied(true);
      toast.success('রিপোর্ট কপি হয়েছে!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('কপি করতে সমস্যা হয়েছে!');
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">রিপোর্ট লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!id || !customer) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-400">গ্রাহক পাওয়া যায়নি</p>
          <Link href="/dashboard/admin/admin-thali-khata" className="text-blue-600 hover:underline mt-2 inline-block">
            হোম পেজে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 print:p-0">
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 print:shadow-none print:border print:border-gray-200">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/admin/admin-thali-khata" className="p-2 hover:bg-gray-100 rounded-full print:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold flex-1 text-center">📊 লেনদেন রিপোর্ট</h1>
          <div className="flex gap-2 print:hidden">
            <button onClick={handleCopyReport} className="p-2 hover:bg-gray-100 rounded-full" title="কপি করুন">
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
            </button>
            <button onClick={handlePrint} className="p-2 hover:bg-gray-100 rounded-full" title="প্রিন্ট করুন">
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-4 print:shadow-none print:border print:border-gray-200">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-2xl font-bold">{customer.name}</h2>
            </div>
            {customer.phone && (
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4" /> {customer.phone}
              </p>
            )}
            {customer.address && (
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4" /> {customer.address}
              </p>
            )}
            <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              মোট {transactions.length} টি লেনদেন
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">বর্তমান ব্যালেন্স</p>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatMoney(balance)}
            </p>
            <p className={`text-sm font-medium ${balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {balance >= 0 ? 'পাবো' : 'দেবো'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm p-4 print:shadow-none print:border print:border-gray-200">
          <p className="text-sm text-gray-500">মোট দেওয়া</p>
          <p className="text-xl font-bold text-red-600">{formatMoney(totalDue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 print:shadow-none print:border print:border-gray-200">
          <p className="text-sm text-gray-500">মোট পাওয়া</p>
          <p className="text-xl font-bold text-green-600">{formatMoney(totalReceive)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 print:shadow-none print:border print:border-gray-200 col-span-2 md:col-span-1">
          <p className="text-sm text-gray-500">মোট লেনদেন</p>
          <p className="text-xl font-bold text-blue-600">{transactions.length} টি</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden print:shadow-none print:border print:border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            সমস্ত লেনদেন
          </h3>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>কোনো লেনদেন নেই</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx, index) => (
              <div key={tx.id} className="p-4 hover:bg-gray-50 transition print:hover:bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-8">#{index + 1}</span>
                    <div>
                      <p className={`font-medium ${tx.type === 'due' ? 'text-red-600' : 'text-green-600'}`}>
                        {tx.type === 'due' ? '📤 দিলাম' : '📥 পেলাম'} {formatMoney(tx.amount)}
                      </p>
                      {tx.description && <p className="text-sm text-gray-500">{tx.description}</p>}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(tx.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {generatedAt && (
        <div className="text-center text-xs text-gray-400 mt-4 print:block hidden">
          রিপোর্ট তৈরি:{' '}
          {generatedAt.toLocaleString('bn-BD', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
};

const ReportPage = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    }
  >
    <ReportContent />
  </Suspense>
);

export default ReportPage;