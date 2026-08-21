'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Plus,
  Cake,
  PackageX,
  CalendarClock,
  Copy,
  Check,
  X,
  Search,
  Loader2,
  Bell,
  ChevronRight,
  User,
  MapPin,
  Phone,
  FileText,
  Repeat,
} from 'lucide-react';

const COLLECTION = 'date_diary_entries';

const TYPE_CONFIG = {
  birthday: {
    label: 'জন্মদিন',
    icon: Cake,
    color: 'pink',
    titleLabel: 'নাম',
    titlePlaceholder: 'যেমন: রহিম উদ্দিন',
  },
  expiry: {
    label: 'মেয়াদ উত্তীর্ণ',
    icon: PackageX,
    color: 'amber',
    titleLabel: 'জিনিসের নাম',
    titlePlaceholder: 'যেমন: NID কার্ড, ঔষধ, ইন্স্যুরেন্স',
  },
  event: {
    label: 'ইভেন্ট',
    icon: CalendarClock,
    color: 'indigo',
    titleLabel: 'ইভেন্টের নাম',
    titlePlaceholder: 'যেমন: বিবাহবার্ষিকী, মিটিং',
  },
};

const EXPIRY_CATEGORIES = ['ডকুমেন্ট', 'ঔষধ', 'ওয়ারেন্টি', 'সাবস্ক্রিপশন', 'বীমা', 'অন্যান্য'];

const COLOR_MAP = {
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', solid: 'bg-pink-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', solid: 'bg-amber-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', solid: 'bg-indigo-500' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', solid: 'bg-rose-500' },
};

const toLocalDateStr = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ── ⬇️⬇️⬇️ এখানে NEW ফাংশন যোগ করুন (calculateAge ও formatAge) ⬇️⬇️⬇️ ──
// এই ফাংশনটি DATE_DIFF ইউটিলিটি ফাংশন হিসেবে ব্যবহার করুন
const calculateAge = (dateStr) => {
  if (!dateStr) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const birthDate = new Date(dateStr);
  birthDate.setHours(0, 0, 0, 0);
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  
  // দিন ঋণাত্মক হলে মাস থেকে ১ কমিয়ে দিন যোগ করুন
  if (days < 0) {
    months--;
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonthDate.getDate();
  }
  
  // মাস ঋণাত্মক হলে বছর থেকে ১ কমিয়ে মাস যোগ করুন
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months, days };
};

// ফরম্যাটিং ফাংশন
const formatAge = (age) => {
  if (!age) return '';
  const parts = [];
  if (age.years > 0) parts.push(`${age.years} বছর`);
  if (age.months > 0) parts.push(`${age.months} মাস`);
  if (age.days > 0) parts.push(`${age.days} দিন`);
  return parts.join(' ') || '০ দিন';
};
// ── ⬆️⬆️⬆️ NEW ফাংশন শেষ ⬆️⬆️⬆️ ──

// ── পরবর্তী তারিখ ও বাকি দিন হিসাব (recurring হলে পরবর্তী বছরের হিসাব করে) ──
const getNextOccurrence = (dateStr, recurring) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const original = new Date(dateStr);
  original.setHours(0, 0, 0, 0);

  if (!recurring) return original;

  let next = new Date(today.getFullYear(), original.getMonth(), original.getDate());
  next.setHours(0, 0, 0, 0);
  if (next < today) {
    next = new Date(today.getFullYear() + 1, original.getMonth(), original.getDate());
  }
  return next;
};

const getDaysUntil = (nextDate) => {
  if (!nextDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDateBn = (date) =>
  date?.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }) || '';

const daysLabel = (days) => {
  if (days === 0) return 'আজ';
  if (days === 1) return 'আগামীকাল';
  if (days < 0) return `${Math.abs(days)} দিন আগে চলে গেছে`;
  return `${days} দিন বাকি`;
};

const buildReminderLine = (entry, nextDate, days) => {
  const cfg = TYPE_CONFIG[entry.type];
  if (entry.type === 'birthday') {
    const age = nextDate.getFullYear() - new Date(entry.date).getFullYear();
    return `🎂 ${entry.title} এর ${age} তম জন্মদিন ${daysLabel(days)} (${formatDateBn(nextDate)})`;
  }
  if (entry.type === 'expiry') {
    return `⚠️ ${entry.title} এর মেয়াদ ${daysLabel(days)} শেষ হবে (${formatDateBn(nextDate)})`;
  }
  return `📅 ${entry.title} ${daysLabel(days)} অনুষ্ঠিত হবে (${formatDateBn(nextDate)})`;
};

const sanitizeText = (raw) => raw;

const DateDairy = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [bannerCopied, setBannerCopied] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: 'birthday',
    title: '',
    date: '',
    fatherName: '',
    motherName: '',
    address: '',
    phone: '',
    category: 'ডকুমেন্ট',
    location: '',
    recurring: false,
    notes: '',
  });

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('date', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('Fetch error:', error);
        toast.error('তথ্য লোড করতে ব্যর্থ হয়েছে!');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── প্রতিটা এন্ট্রির জন্য পরবর্তী তারিখ ও বাকি দিন হিসাব ──
  const enrichedEntries = useMemo(() => {
    return entries
      .map((entry) => {
        const isRecurring = entry.type === 'birthday' ? true : !!entry.recurring;
        const nextDate = getNextOccurrence(entry.date, isRecurring);
        const daysUntil = getDaysUntil(nextDate);
        return { ...entry, isRecurring, nextDate, daysUntil };
      })
      .sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0));
  }, [entries]);

  // ── ব্যানারের জন্য সবচেয়ে কাছের ৩টা (আজ বা ভবিষ্যতের) ──
  const upcomingHighlights = useMemo(() => {
    return enrichedEntries.filter((e) => e.daysUntil !== null && e.daysUntil >= 0).slice(0, 3);
  }, [enrichedEntries]);

  const bannerText = useMemo(() => {
    if (upcomingHighlights.length === 0) return 'আপাতত নিকটবর্তী কোনো রিমাইন্ডার নেই।';
    return upcomingHighlights.map((e) => buildReminderLine(e, e.nextDate, e.daysUntil)).join('\n');
  }, [upcomingHighlights]);

  const copyBannerText = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(bannerText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = bannerText;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setBannerCopied(true);
      toast.success('রিমাইন্ডার কপি হয়েছে!');
      setTimeout(() => setBannerCopied(false), 2000);
    } catch (error) {
      toast.error('কপি করতে সমস্যা হয়েছে!');
    }
  };

  const filteredEntries = useMemo(() => {
    return enrichedEntries.filter((entry) => {
      const matchesType = typeFilter === 'all' || entry.type === typeFilter;
      const matchesSearch = entry.title?.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [enrichedEntries, typeFilter, searchQuery]);

  const openModal = () => {
    setFormData({
      type: 'birthday',
      title: '',
      date: '',
      fatherName: '',
      motherName: '',
      address: '',
      phone: '',
      category: 'ডকুমেন্ট',
      location: '',
      recurring: false,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.warning('নাম/শিরোনাম দিন!');
      return;
    }
    if (!formData.date) {
      toast.warning('তারিখ নির্বাচন করুন!');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('সংরক্ষণ করা হচ্ছে...');

    try {
      const payload = {
        type: formData.type,
        title: formData.title.trim(),
        date: formData.date,
        notes: formData.notes.trim(),
        recurring: formData.type === 'birthday' ? true : formData.type === 'event' ? formData.recurring : false,
      };

      if (formData.type === 'birthday') {
        payload.fatherName = formData.fatherName.trim();
        payload.motherName = formData.motherName.trim();
        payload.address = formData.address.trim();
        payload.phone = formData.phone.trim();
      } else if (formData.type === 'expiry') {
        payload.category = formData.category;
      } else if (formData.type === 'event') {
        payload.location = formData.location.trim();
      }

      await addDoc(collection(db, COLLECTION), { ...payload, createdAt: serverTimestamp() });
      toast.success('সফলভাবে যোগ হয়েছে!', { id: toastId });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('সংরক্ষণ করতে সমস্যা হয়েছে!', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 bg-gray-50/50 min-h-screen relative pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="w-7 h-7 text-indigo-600" />
          তারিখ ডায়েরি
        </h1>
        <p className="text-sm text-gray-500 mt-1">জন্মদিন, মেয়াদ উত্তীর্ণ ও ইভেন্টের রিমাইন্ডার</p>
      </div>

      {/* ── ব্যানার: নিকটবর্তী রিমাইন্ডার ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -right-4 top-16 w-24 h-24 bg-white/10 rounded-full" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 px-3 py-1 rounded-full">
              <Bell className="w-3.5 h-3.5" />
              আসন্ন রিমাইন্ডার
            </span>
            <button
              onClick={copyBannerText}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition"
            >
              {bannerCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {bannerCopied ? 'কপি হয়েছে' : 'কপি করুন'}
            </button>
          </div>

          {upcomingHighlights.length === 0 ? (
            <p className="text-white/80 text-sm py-4">আপাতত নিকটবর্তী কোনো রিমাইন্ডার নেই।</p>
          ) : (
            <div className="space-y-2.5">
              {upcomingHighlights.map((entry) => {
                const cfg = TYPE_CONFIG[entry.type];
                const Icon = cfg.icon;
                return (
                  <Link
                    key={entry.id}
                    href={`/dashboard/admin/admin-date-dairy/view-details?id=${entry.id}`}
                    className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-2xl p-3 transition"
                  >
                    <div className="p-2 bg-white/15 rounded-xl shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{entry.title}</p>
                      <p className="text-xs text-white/70">{formatDateBn(entry.nextDate)}</p>
                    </div>
                    <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {daysLabel(entry.daysUntil)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="নাম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-indigo-500 bg-gray-50/50 focus:bg-white transition"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              typeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            সব
          </button>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                typeFilter === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── তালিকা ── */}
      <div className="space-y-2.5">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            কোনো এন্ট্রি পাওয়া যায়নি। + বাটনে ক্লিক করে নতুন কিছু যোগ করুন।
          </div>
        ) : (
          // ── ⬇️⬇️⬇️ এখানে তালিকার অংশ আপডেট করুন ⬇️⬇️⬇️ ──
          filteredEntries.map((entry) => {
            const cfg = TYPE_CONFIG[entry.type];
            const c = COLOR_MAP[cfg.color];
            const Icon = cfg.icon;
            const overdue = entry.daysUntil !== null && entry.daysUntil < 0;
            
            // ⬇️ এখানে বয়স/সময় পার্থক্য গণনা করুন ⬇️
            const age = calculateAge(entry.date);
            const ageText = formatAge(age);
            
            return (
              <Link
                key={entry.id}
                href={`/dashboard/admin/admin-date-dairy/view-details?id=${entry.id}`}
                className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition"
              >
                <div className={`p-3 rounded-xl shrink-0 ${c.bg} ${c.text}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 truncate">{entry.title}</p>
                  <p className="text-xs text-gray-400">
                    {cfg.label} • {formatDateBn(entry.nextDate)}
                  </p>
                  {/* ⬇️⬇️⬇️ এখানে নতুন অংশ যোগ করুন (বয়স/সময় দেখানো) ⬇️⬇️⬇️ */}
                  {age && entry.type === 'birthday' && (
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">
                      🎂 {ageText} হয়েছে
                    </p>
                  )}
                  {age && entry.type !== 'birthday' && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      📅 {ageText} আগে
                    </p>
                  )}
                  {/* ⬆️⬆️⬆️ নতুন অংশ শেষ ⬆️⬆️⬆️ */}
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    overdue ? 'bg-rose-100 text-rose-600' : `${c.bg} ${c.text}`
                  }`}
                >
                  {daysLabel(entry.daysUntil)}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
            );
          })
          // ── ⬆️⬆️⬆️ তালিকার অংশ শেষ ⬆️⬆️⬆️ ──
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ── Add Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                নতুন রিমাইন্ডার যোগ করুন
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selector */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">ধরন নির্বাচন করুন</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const active = formData.type === key;
                    const c = COLOR_MAP[cfg.color];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: key })}
                        className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-semibold border transition ${
                          active ? `${c.bg} ${c.border} ${c.text}` : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">{TYPE_CONFIG[formData.type].titleLabel}</label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder={TYPE_CONFIG[formData.type].titlePlaceholder}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  {formData.type === 'birthday' ? 'জন্মতারিখ' : formData.type === 'expiry' ? 'মেয়াদ উত্তীর্ণের তারিখ' : 'ইভেন্টের তারিখ'}
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                  required
                />
              </div>

              {/* ── জন্মদিন-নির্দিষ্ট ফিল্ড ── */}
              {formData.type === 'birthday' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">পিতার নাম</label>
                      <input
                        type="text"
                        maxLength={100}
                        value={formData.fatherName}
                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">মাতার নাম</label>
                      <input
                        type="text"
                        maxLength={100}
                        value={formData.motherName}
                        onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">ঠিকানা</label>
                    <input
                      type="text"
                      maxLength={150}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* ── এক্সপায়ার-নির্দিষ্ট ফিল্ড ── */}
              {formData.type === 'expiry' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">ক্যাটাগরি</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500 bg-white"
                  >
                    {EXPIRY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ── ইভেন্ট-নির্দিষ্ট ফিল্ড ── */}
              {formData.type === 'event' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">স্থান (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      maxLength={150}
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.recurring}
                      onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <Repeat className="w-3.5 h-3.5" />
                    প্রতি বছর পুনরাবৃত্তি হবে
                  </label>
                </>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">নোট (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  maxLength={300}
                  placeholder="অতিরিক্ত তথ্য..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateDairy;