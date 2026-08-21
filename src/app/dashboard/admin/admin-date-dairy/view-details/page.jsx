'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Cake,
  PackageX,
  CalendarClock,
  Copy,
  Check,
  Share2,
  Edit2,
  Trash2,
  Loader2,
  User,
  MapPin,
  Phone,
  FileText,
  Repeat,
  X,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

const COLLECTION = 'date_diary_entries';

const TYPE_CONFIG = {
  birthday: { label: 'জন্মদিন', icon: Cake, color: 'pink' },
  expiry: { label: 'মেয়াদ উত্তীর্ণ', icon: PackageX, color: 'amber' },
  event: { label: 'ইভেন্ট', icon: CalendarClock, color: 'indigo' },
};

const COLOR_MAP = {
  pink: { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-600', gradient: 'from-pink-500 to-rose-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', gradient: 'from-amber-500 to-orange-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', gradient: 'from-indigo-500 to-purple-500' },
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

const getNextOccurrence = (dateStr, recurring) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const original = new Date(dateStr);
  original.setHours(0, 0, 0, 0);
  if (!recurring) return original;

  let next = new Date(today.getFullYear(), original.getMonth(), original.getDate());
  next.setHours(0, 0, 0, 0);
  if (next < today) next = new Date(today.getFullYear() + 1, original.getMonth(), original.getDate());
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
  if (days === null) return '';
  if (days === 0) return 'আজ';
  if (days === 1) return 'আগামীকাল';
  if (days < 0) return `${Math.abs(days)} দিন আগে চলে গেছে`;
  return `${days} দিন বাকি`;
};

const ViewDetailsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [copied, setCopied] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, COLLECTION, id));
        if (snap.exists()) {
          setEntry({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        console.error('Load error:', error);
        toast.error('তথ্য লোড করতে সমস্যা হয়েছে!');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const cfg = entry ? TYPE_CONFIG[entry.type] : null;
  const c = cfg ? COLOR_MAP[cfg.color] : null;
  const isRecurring = entry ? (entry.type === 'birthday' ? true : !!entry.recurring) : false;
  const nextDate = entry ? getNextOccurrence(entry.date, isRecurring) : null;
  const daysUntil = getDaysUntil(nextDate);
  const overdue = daysUntil !== null && daysUntil < 0;

  // ── ⬇️⬇️⬇️ এখানে বয়স/সময় পার্থক্য গণনা করুন ⬇️⬇️⬇️ ──
  const age = entry ? calculateAge(entry.date) : null;
  const ageText = formatAge(age);
  // ── ⬆️⬆️⬆️ বয়স/সময় পার্থক্য গণনা শেষ ⬆️⬆️⬆️ ──

  const buildShareText = () => {
    if (!entry) return '';
    const lines = [
      `${cfg.label === 'জন্মদিন' ? '🎂' : cfg.label === 'মেয়াদ উত্তীর্ণ' ? '⚠️' : '📅'} ${entry.title}`,
      '━━━━━━━━━━━━━━━━━━',
      `ধরন: ${cfg.label}`,
      `তারিখ: ${formatDateBn(nextDate)}`,
      `অবস্থা: ${daysLabel(daysUntil)}`,
    ];
    // ── ⬇️⬇️⬇️ শেয়ার টেক্সটে বয়স/সময় যোগ করুন ⬇️⬇️⬇️ ──
    if (age) {
      lines.push(`সময় পার্থক্য: ${ageText}`);
    }
    // ── ⬆️⬆️⬆️ শেয়ার টেক্সটে বয়স/সময় যোগ করা শেষ ⬆️⬆️⬆️ ──
    if (entry.type === 'birthday') {
      if (entry.fatherName) lines.push(`পিতার নাম: ${entry.fatherName}`);
      if (entry.motherName) lines.push(`মাতার নাম: ${entry.motherName}`);
      if (entry.address) lines.push(`ঠিকানা: ${entry.address}`);
      if (entry.phone) lines.push(`মোবাইল: ${entry.phone}`);
    }
    if (entry.type === 'expiry' && entry.category) lines.push(`ক্যাটাগরি: ${entry.category}`);
    if (entry.type === 'event' && entry.location) lines.push(`স্থান: ${entry.location}`);
    if (entry.notes) lines.push(`নোট: ${entry.notes}`);
    lines.push('━━━━━━━━━━━━━━━━━━');
    return lines.join('\n');
  };

  const copyToClipboard = async (text) => {
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

  const handleCopy = async () => {
    try {
      await copyToClipboard(buildShareText());
      setCopied(true);
      toast.success('কপি হয়েছে!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('কপি করতে সমস্যা হয়েছে!');
    }
  };

  const handleShare = async () => {
    const text = buildShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: entry.title, text });
      } catch (error) {
        if (error.name !== 'AbortError') toast.error('শেয়ার করতে সমস্যা হয়েছে!');
      }
    } else {
      await handleCopy();
      toast.info('শেয়ার সাপোর্ট নেই — টেক্সট কপি হয়েছে, পেস্ট করে শেয়ার করুন।');
    }
  };

  const openEdit = () => {
    setFormData({
      title: entry.title || '',
      date: entry.date || '',
      fatherName: entry.fatherName || '',
      motherName: entry.motherName || '',
      address: entry.address || '',
      phone: entry.phone || '',
      category: entry.category || 'ডকুমেন্ট',
      location: entry.location || '',
      recurring: !!entry.recurring,
      notes: entry.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      toast.warning('নাম ও তারিখ দিতে হবে!');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('আপডেট করা হচ্ছে...');
    try {
      const payload = {
        title: formData.title.trim(),
        date: formData.date,
        notes: formData.notes.trim(),
      };
      if (entry.type === 'birthday') {
        payload.fatherName = formData.fatherName.trim();
        payload.motherName = formData.motherName.trim();
        payload.address = formData.address.trim();
        payload.phone = formData.phone.trim();
      } else if (entry.type === 'expiry') {
        payload.category = formData.category;
      } else if (entry.type === 'event') {
        payload.location = formData.location.trim();
        payload.recurring = formData.recurring;
      }

      await updateDoc(doc(db, COLLECTION, id), payload);
      setEntry({ ...entry, ...payload });
      toast.success('আপডেট হয়েছে!', { id: toastId });
      setIsEditOpen(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('আপডেট করতে সমস্যা হয়েছে!', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`"${entry.title}" মুছে ফেলবেন?`)) return;
    const toastId = toast.loading('মুছে ফেলা হচ্ছে...');
    try {
      await deleteDoc(doc(db, COLLECTION, id));
      toast.success('মুছে ফেলা হয়েছে!', { id: toastId });
      router.push('/dashboard/admin/admin-date-dairy');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('মুছতে সমস্যা হয়েছে!', { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!id || !entry) {
    return (
      <div className="max-w-lg mx-auto p-4 mt-10">
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <p className="text-gray-400">এন্ট্রি পাওয়া যায়নি</p>
          <Link href="/dashboard/admin/admin-date-dairy" className="text-indigo-600 hover:underline mt-2 inline-block text-sm">
            হোম পেজে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  const Icon = cfg.icon;

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8 space-y-5 pb-16">
      <Link
        href="/dashboard/admin/admin-date-dairy"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> ফিরে যান
      </Link>

      {/* Header Card */}
      <div className={`bg-gradient-to-br ${c.gradient} rounded-3xl p-6 text-white shadow-lg`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/80 font-semibold">{cfg.label}</p>
            <h1 className="text-xl font-bold">{entry.title}</h1>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white/15 rounded-xl p-3">
          <div>
            <p className="text-xs text-white/70">পরবর্তী তারিখ</p>
            <p className="font-semibold text-sm">{formatDateBn(nextDate)}</p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              overdue ? 'bg-rose-500/90' : 'bg-white/25'
            }`}
          >
            {daysLabel(daysUntil)}
          </span>
        </div>
        {/* ── ⬇️⬇️⬇️ এখানে নতুন অংশ যোগ করুন (বয়স/সময় দেখানো) ⬇️⬇️⬇️ ── */}
        {age && entry.type === 'birthday' && (
          <div className="mt-3 bg-white/15 rounded-xl p-3">
            <p className="text-xs text-white/70">বয়স</p>
            <p className="font-semibold text-sm flex items-center gap-2">
              🎂 {ageText}
            </p>
          </div>
        )}
        {age && entry.type !== 'birthday' && (
          <div className="mt-3 bg-white/15 rounded-xl p-3">
            <p className="text-xs text-white/70">সময় পার্থক্য</p>
            <p className="font-semibold text-sm flex items-center gap-2">
              📅 {ageText} আগে
            </p>
          </div>
        )}
        {/* ── ⬆️⬆️⬆️ নতুন অংশ শেষ ⬆️⬆️⬆️ ── */}
        {isRecurring && (
          <p className="text-[11px] text-white/70 mt-2 flex items-center gap-1">
            <Repeat className="w-3 h-3" /> প্রতি বছর পুনরাবৃত্তি হয়
          </p>
        )}
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">বিস্তারিত তথ্য</h2>

        {entry.type === 'birthday' && (
          <>
            {entry.fatherName && (
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500">পিতার নাম:</span>
                <span className="font-medium text-gray-800">{entry.fatherName}</span>
              </div>
            )}
            {entry.motherName && (
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500">মাতার নাম:</span>
                <span className="font-medium text-gray-800">{entry.motherName}</span>
              </div>
            )}
            {entry.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500">ঠিকানা:</span>
                <span className="font-medium text-gray-800">{entry.address}</span>
              </div>
            )}
            {entry.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500">মোবাইল:</span>
                <span className="font-medium text-gray-800">{entry.phone}</span>
              </div>
            )}
          </>
        )}

        {entry.type === 'expiry' && entry.category && (
          <div className="flex items-center gap-3 text-sm">
            <FileText className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-gray-500">ক্যাটাগরি:</span>
            <span className="font-medium text-gray-800">{entry.category}</span>
          </div>
        )}

        {entry.type === 'event' && entry.location && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-gray-500">স্থান:</span>
            <span className="font-medium text-gray-800">{entry.location}</span>
          </div>
        )}

        {entry.notes && (
          <div className="pt-2 border-t border-gray-50">
            <p className="text-xs text-gray-500 mb-1">নোট</p>
            <p className="text-sm text-gray-700">{entry.notes}</p>
          </div>
        )}

        {!entry.fatherName && !entry.motherName && !entry.address && !entry.phone && !entry.category && !entry.location && !entry.notes && (
          <p className="text-sm text-gray-400">অতিরিক্ত কোনো তথ্য যোগ করা হয়নি।</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'কপি হয়েছে!' : 'কপি করুন'}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition"
        >
          <Share2 className="w-4 h-4" />
          শেয়ার করুন
        </button>
        <button
          onClick={openEdit}
          className="flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
        >
          <Edit2 className="w-4 h-4" />
          সম্পাদনা করুন
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-semibold transition"
        >
          <Trash2 className="w-4 h-4" />
          মুছে ফেলুন
        </button>
      </div>

      {/* ── Edit Modal ── */}
      {isEditOpen && formData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                সম্পাদনা করুন
              </h2>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">নাম / শিরোনাম</label>
                <input
                  type="text"
                  maxLength={100}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">তারিখ</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                  required
                />
              </div>

              {entry.type === 'birthday' && (
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

              {entry.type === 'expiry' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">ক্যাটাগরি</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500 bg-white"
                  >
                    {['ডকুমেন্ট', 'ঔষধ', 'ওয়ারেন্টি', 'সাবস্ক্রিপশন', 'বীমা', 'অন্যান্য'].map((cVal) => (
                      <option key={cVal} value={cVal}>
                        {cVal}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {entry.type === 'event' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">স্থান</label>
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
                <label className="text-xs font-semibold text-gray-600 block mb-1">নোট</label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
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
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ViewDetails = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    }
  >
    <ViewDetailsContent />
  </Suspense>
);

export default ViewDetails;