'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  Printer,
  Calendar,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Loader2,
  ShoppingBag,
} from 'lucide-react';

const RANGE_OPTIONS = [
  { id: 'today', label: 'আজকের বিক্রি' },
  { id: 'yesterday', label: 'গতকাল' },
  { id: '7days', label: 'গত ৭ দিন' },
  { id: '30days', label: 'গত ৩০ দিন' },
  { id: '1year', label: 'গত ১ বছর' },
  { id: 'month', label: 'নির্দিষ্ট মাস' },
  { id: 'all', label: 'সব বিক্রি' },
];

export default function SalesHistoryPage() {
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyRange, setHistoryRange] = useState('today');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const qSales = query(collection(db, 'stationery_sales'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      qSales,
      (snapshot) => {
        setSalesHistory(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('Sales Fetch Error:', error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── ফিল্টারিং লজিক ──
  const filteredSalesHistory = salesHistory.filter((sale) => {
    const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.timestamp || 0);
    const now = new Date();

    const isToday = saleDate.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = saleDate.toDateString() === yesterday.toDateString();

    const diffDays = (now - saleDate) / (1000 * 60 * 60 * 24);

    if (historyRange === 'today') return isToday;
    if (historyRange === 'yesterday') return isYesterday;
    if (historyRange === '7days') return diffDays <= 7;
    if (historyRange === '30days') return diffDays <= 30;
    if (historyRange === '1year') return diffDays <= 365;
    if (historyRange === 'month') {
      return saleDate.toISOString().slice(0, 7) === selectedMonth;
    }
    return true; // 'all'
  });

  const filteredTotalAmount = filteredSalesHistory.reduce((acc, s) => acc + (Number(s.totalPrice) || 0), 0);
  const filteredTotalProfit = filteredSalesHistory.reduce((acc, s) => acc + (Number(s.profit) || 0), 0);
  const filteredTotalQty = filteredSalesHistory.reduce((acc, s) => acc + (Number(s.qty) || 0), 0);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-gray-500 font-medium">বিক্রয়ের হিস্টরি লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header + Print Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/admin-school-stationary"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
            title="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-indigo-600" />
              বিক্রয়ের হিস্টরি
            </h1>
            <p className="text-sm text-gray-500 mt-1">সময় অনুযায়ী বিক্রয় ফিল্টার করুন ও রিপোর্ট প্রিন্ট করুন</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm w-full sm:w-auto"
        >
          <Printer className="w-4 h-4" />
          রিপোর্ট প্রিন্ট / PDF
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 mr-1">সময়সীমা:</span>
          {RANGE_OPTIONS.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setHistoryRange(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                historyRange === btn.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {btn.label}
            </button>
          ))}

          {historyRange === 'month' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-1.5 border rounded-lg text-xs focus:outline-indigo-500 bg-gray-50 font-medium"
            />
          )}
        </div>
      </div>

      {/* সামারি কার্ড */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-indigo-100 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">মোট বিক্রয়</p>
            <p className="text-lg font-bold text-indigo-950">৳ {filteredTotalAmount.toLocaleString('bn-BD')}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">মোট লাভ</p>
            <p className="text-lg font-bold text-emerald-700">৳ {filteredTotalProfit.toLocaleString('bn-BD')}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">মোট বিক্রি আইটেম</p>
            <p className="text-lg font-bold text-blue-900">{filteredTotalQty} টি</p>
          </div>
        </div>
      </div>

      {/* প্রিন্ট হেডার */}
      <div className="hidden print:block text-center border-b pb-4">
        <h2 className="text-xl font-bold">স্কুল স্টেশনারি বিক্রয় রিপোর্ট</h2>
        <p className="text-xs text-gray-500">তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
      </div>

      {/* টেবিল */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b text-gray-400 font-semibold bg-gray-50/50">
                <th className="p-3">তারিখ ও সময়</th>
                <th className="p-3">গ্রাহকের নাম</th>
                <th className="p-3">পণ্যের নাম</th>
                <th className="p-3">পরিমাণ</th>
                <th className="p-3">মোট মূল্য</th>
                <th className="p-3">লাভ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSalesHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    নির্ধারিত সময়ে কোনো বিক্রয়ের রেকর্ড পাওয়া যায়নি!
                  </td>
                </tr>
              ) : (
                filteredSalesHistory.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-3 text-[11px] text-gray-500">{sale.date}</td>
                    <td className="p-3 font-medium text-gray-700">{sale.customerName || 'সাধারণ গ্রাহক'}</td>
                    <td className="p-3 font-semibold text-gray-800">{sale.productName}</td>
                    <td className="p-3 font-semibold text-indigo-600">{sale.qty} টি</td>
                    <td className="p-3 font-bold text-emerald-600">৳ {sale.totalPrice}</td>
                    <td className="p-3 font-medium text-indigo-700">৳ {sale.profit || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}