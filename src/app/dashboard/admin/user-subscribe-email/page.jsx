"use client";

import React, { useEffect, useState } from "react";
// Firebase Imports
import { db } from "@/lib/firebase"; // আপনার ফায়ারবেস কনফিগ পাথে আপডেট করুন
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

// Icons
import {
  MdEmail,
  MdDelete,
  MdSearch,
  MdContentCopy,
  MdCheckCircle,
  MdPeople,
  MdRefresh,
  MdMessage,
  MdClose,
  MdMarkEmailRead,
  MdMarkEmailUnread,
  MdPerson,
  MdSubject,
} from "react-icons/md";

const TABS = [
  { id: "subscribers", label: "Subscribers", icon: MdPeople },
  { id: "messages", label: "Contact Messages", icon: MdMessage },
];

const SubscribeUserEmail = () => {
  const [activeTab, setActiveTab] = useState("subscribers");

  // ── Subscribers State ──
  const [subscribers, setSubscribers] = useState([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [deletingSubId, setDeletingSubId] = useState(null);

  // ── Contact Messages State ──
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messageSearch, setMessageSearch] = useState("");
  const [deletingMsgId, setDeletingMsgId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  // ── Firestore থেকে রিয়েলটাইমে সাবস্ক্রাইবার নিয়ে আসা ──
  useEffect(() => {
    const q = query(collection(db, "subscribers"), orderBy("subscribedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setSubscribers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingSubscribers(false);
      },
      (error) => {
        console.error("Error fetching subscribers: ", error);
        setLoadingSubscribers(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ── Firestore থেকে রিয়েলটাইমে কন্টাক্ট মেসেজ নিয়ে আসা ──
  useEffect(() => {
    const q = query(collection(db, "contact_messages"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingMessages(false);
      },
      (error) => {
        console.error("Error fetching contact messages: ", error);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ── সাবস্ক্রাইবার ডিলিট করা ──
  const handleDeleteSubscriber = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subscriber?")) return;

    setDeletingSubId(id);
    try {
      await deleteDoc(doc(db, "subscribers", id));
    } catch (error) {
      console.error("Error deleting subscriber: ", error);
      alert("Failed to delete subscriber.");
    } finally {
      setDeletingSubId(null);
    }
  };

  // ── কন্টাক্ট মেসেজ ডিলিট করা ──
  const handleDeleteMessage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    setDeletingMsgId(id);
    try {
      await deleteDoc(doc(db, "contact_messages", id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (error) {
      console.error("Error deleting message: ", error);
      alert("Failed to delete message.");
    } finally {
      setDeletingMsgId(null);
    }
  };

  // ── মেসেজ পড়া/না-পড়া স্ট্যাটাস টগল ──
  const toggleMessageStatus = async (msg) => {
    const newStatus = msg.status === "read" ? "unread" : "read";
    try {
      await updateDoc(doc(db, "contact_messages", msg.id), { status: newStatus });
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating message status: ", error);
    }
  };

  // ── মেসেজ খোলার সময় স্বয়ংক্রিয়ভাবে read করা ──
  const openMessage = async (msg) => {
    setSelectedMessage(msg);
    if (msg.status !== "read") {
      try {
        await updateDoc(doc(db, "contact_messages", msg.id), { status: "read" });
      } catch (error) {
        console.error("Error marking message as read: ", error);
      }
    }
  };

  // ── ইমেইল কপি করা (সাবস্ক্রাইবার) ──
  const handleCopy = (email, id) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── কন্টাক্ট মেসেজের ইমেইল কপি করা ──
  const handleCopyMsgEmail = (email, id) => {
    navigator.clipboard.writeText(email);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // ── সব সাবস্ক্রাইবার ইমেইল একসাথে কপি করা ──
  const handleCopyAll = () => {
    const allEmails = subscribers.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(allEmails);
    alert("All subscriber emails copied to clipboard!");
  };

  // ── ফিল্টারড ডেটা ──
  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email?.toLowerCase().includes(subscriberSearch.toLowerCase())
  );

  const filteredMessages = messages.filter((msg) => {
    const q = messageSearch.toLowerCase();
    return (
      msg.name?.toLowerCase().includes(q) ||
      msg.email?.toLowerCase().includes(q) ||
      msg.subject?.toLowerCase().includes(q)
    );
  });

  const unreadCount = messages.filter((m) => m.status !== "read").length;

  // ── টাইম ফরম্যাট করা ──
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-8 p-6 sm:p-8 bg-white dark:bg-gray-900/90 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all duration-300">
      {/* ── Header Area ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <MdPeople className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Audience & Messages
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Manage subscribers and contact form submissions
            </p>
          </div>
        </div>

        {activeTab === "subscribers" && subscribers.length > 0 && (
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400">
              Total: {subscribers.length}
            </div>
            <button
              onClick={handleCopyAll}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/15 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <MdContentCopy className="w-4 h-4" />
              <span>Copy All</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-2 mt-6 mb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "subscribers" && subscribers.length > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  {subscribers.length}
                </span>
              )}
              {tab.id === "messages" && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search Bar Area ── */}
      <div className="my-6">
        <div className="relative max-w-md">
          <MdSearch className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={activeTab === "subscribers" ? "Search by email..." : "Search by name, email, or subject..."}
            value={activeTab === "subscribers" ? subscriberSearch : messageSearch}
            onChange={(e) =>
              activeTab === "subscribers"
                ? setSubscriberSearch(e.target.value)
                : setMessageSearch(e.target.value)
            }
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* ══════════════ SUBSCRIBERS TAB ══════════════ */}
      {activeTab === "subscribers" && (
        <>
          {loadingSubscribers ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <MdRefresh className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-xs font-medium">Loading subscribers...</p>
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="text-center py-16 px-4 bg-gray-50/50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <MdEmail className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {subscriberSearch ? "No subscriber found matching your search" : "No subscribers yet"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {subscriberSearch ? "Try searching with another keyword" : "New email subscriptions will appear here automatically"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800/80 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                    <th className="px-5 py-3.5">#</th>
                    <th className="px-5 py-3.5">Email Address</th>
                    <th className="px-5 py-3.5">Subscribed Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs sm:text-sm">
                  {filteredSubscribers.map((sub, index) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors duration-150"
                    >
                      <td className="px-5 py-4 font-medium text-gray-400 dark:text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <MdEmail className="w-4 h-4" />
                          </div>
                          <span className="truncate max-w-xs sm:max-w-none">{sub.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(sub.subscribedAt)}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(sub.email, sub.id)}
                            className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-all cursor-pointer"
                            title="Copy Email"
                          >
                            {copiedId === sub.id ? (
                              <MdCheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <MdContentCopy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteSubscriber(sub.id)}
                            disabled={deletingSubId === sub.id}
                            className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-all disabled:opacity-40 cursor-pointer"
                            title="Delete Subscriber"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══════════════ CONTACT MESSAGES TAB ══════════════ */}
      {activeTab === "messages" && (
        <>
          {loadingMessages ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <MdRefresh className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-xs font-medium">Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-16 px-4 bg-gray-50/50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <MdMessage className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {messageSearch ? "No message found matching your search" : "No contact messages yet"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {messageSearch ? "Try searching with another keyword" : "New messages from the Contact page will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMessages.map((msg) => {
                const isUnread = msg.status !== "read";
                return (
                  <div
                    key={msg.id}
                    onClick={() => openMessage(msg)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${
                      isUnread
                        ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40"
                        : "bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isUnread
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {msg.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm truncate ${
                            isUnread
                              ? "font-bold text-gray-900 dark:text-white"
                              : "font-medium text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {msg.name}
                        </p>
                        <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{msg.email}</p>
                      <p
                        className={`text-xs mt-1 truncate ${
                          isUnread ? "font-semibold text-gray-800 dark:text-gray-200" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {msg.subject}
                      </p>
                    </div>

                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => toggleMessageStatus(msg)}
                        className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-all cursor-pointer"
                        title={isUnread ? "Mark as read" : "Mark as unread"}
                      >
                        {isUnread ? (
                          <MdMarkEmailRead className="w-4 h-4" />
                        ) : (
                          <MdMarkEmailUnread className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        disabled={deletingMsgId === msg.id}
                        className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-all disabled:opacity-40 cursor-pointer"
                        title="Delete Message"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Message Detail Modal ── */}
      {selectedMessage && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-gray-100 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MdMessage className="w-5 h-5 text-blue-600" />
                Message Details
              </h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg transition cursor-pointer"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MdPerson className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500 dark:text-gray-400">Name:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedMessage.name}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <MdEmail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                <span className="font-semibold text-gray-900 dark:text-white truncate flex-1">
                  {selectedMessage.email}
                </span>
                <button
                  onClick={() => handleCopyMsgEmail(selectedMessage.email, selectedMessage.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer shrink-0"
                  title="Copy Email"
                >
                  {copiedMsgId === selectedMessage.id ? (
                    <MdCheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <MdContentCopy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <MdSubject className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500 dark:text-gray-400">Subject:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedMessage.subject}</span>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Message</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                  {selectedMessage.message}
                </p>
              </div>

              <p className="text-[11px] text-gray-400 pt-1">
                Received: {formatDate(selectedMessage.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || "")}`}
                className="flex-1 text-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/15 transition-all cursor-pointer"
              >
                Reply via Email
              </a>
              <button
                onClick={() => handleDeleteMessage(selectedMessage.id)}
                className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscribeUserEmail;