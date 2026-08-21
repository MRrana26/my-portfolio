"use client";

import React, { useRef, useState } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle2, 
  MessageSquare,
  Globe,
  Copy,
  Check,
  Loader2
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// GitHub SVG Component
const GithubIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// LinkedIn SVG Component
const LinkedinIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBMIT_COOLDOWN_MS = 30_000; // ৩০ সেকেন্ড rate-limit

const ContactHomePage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "", // honeypot — মানুষ দেখতে পাবে না
  });
  const lastSubmitRef = useRef(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Honeypot: বট এই ফিল্ড পূরণ করে ফেলবে, মানুষ দেখতেই পাবে না ──
    if (formData.website.trim() !== "") return;

    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    // ── Validation ──
    if (!name || !EMAIL_REGEX.test(email) || !subject || message.length < 10) {
      alert("অনুগ্রহ করে সঠিকভাবে সব ফিল্ড পূরণ করুন (মেসেজ কমপক্ষে ১০ অক্ষর)।");
      return;
    }

    // ── Rate limit (client-side) ──
    const now = Date.now();
    if (now - lastSubmitRef.current < SUBMIT_COOLDOWN_MS) {
      alert("অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "contact_messages"), {
        name,
        email,
        subject,
        message: message.slice(0, 2000),
        createdAt: serverTimestamp(),
        status: "unread",
      });

      lastSubmitRef.current = now;
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "", website: "" });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("দুঃখিত, মেসেজ পাঠাতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  // ক্লিপবোর্ডে কপি করার ফাংশন
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const contactDetails = [
    {
      key: "phone",
      icon: Phone,
      title: "Phone Number",
      value: "+880 1946-228026",
      copyValue: "+8801946228026",
      isCopyable: true,
    },
    {
      key: "email",
      icon: Mail,
      title: "Email Address",
      value: "hafezmasudranamn@gmail.com",
      copyValue: "hafezmasudranamn@gmail.com",
      isCopyable: true,
    },
    {
      key: "location",
      icon: MapPin,
      title: "Location", 
      value: "Dhobaura, Mymensingh, Dhaka, Bangladesh",
      link: "https://masudur-rahman.com",
      isCopyable: false,
    },
  ];

  const socialLinks = [
    { name: "GitHub", icon: GithubIcon, url: "https://github.com/MRrana26" },
    { name: "LinkedIn", icon: LinkedinIcon, url: "https://www.linkedin.com/in/dev-masudur-rahman" },
    { name: "Portfolio", icon: Globe, url: "https://masudur-rahman.com" },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto my-12 p-6 sm:p-10 bg-white dark:bg-gray-900/80 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all duration-300">
      
      {/* ── Section Header ── */}
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
          <MessageSquare className="w-3.5 h-3.5" /> Get In Touch
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Let’s Connect & Collaborate
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Have a project in mind, a job opportunity, or just want to say hello? Feel free to reach out!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
        
        {/* ── Left Column: Contact Cards ── */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            {contactDetails.map((item) => {
              const Icon = item.icon;
              const isCopied = copiedKey === item.key;

              if (item.isCopyable) {
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleCopy(item.copyValue, item.key)}
                    className="w-full text-left group flex items-center justify-between p-4 bg-gray-50/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 rounded-2xl transition-all duration-300 hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 dark:text-gray-500">
                          {item.title}
                        </h4>
                        <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.value}
                        </p>
                      </div>
                    </div>

                    <div className="p-2 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-500 animate-in zoom-in-50" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                );
              }

              return (
                <a
                  key={item.key}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 bg-gray-50/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 rounded-2xl transition-all duration-300 hover:shadow-md"
                >
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 dark:text-gray-500">
                      {item.title}
                    </h4>
                    <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.value}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Social Profiles */}
          <div className="p-5 bg-gray-50/60 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Social Profiles
            </h4>
            <div className="flex items-center gap-3">
              {socialLinks.map((social, idx) => {
                const Icon = social.icon;
                return (
                  <a
                    key={idx}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-200 hover:-translate-y-0.5 shadow-xs"
                    aria-label={social.name}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right Column: Contact Form ── */}
        <div className="lg:col-span-3 bg-gray-50/60 dark:bg-gray-800/40 p-6 sm:p-8 rounded-2xl border border-gray-100 dark:border-gray-800">
          {submitted ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center space-y-3 p-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Message Sent Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Thank you for reaching out. I will get back to you as soon as possible.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ── Honeypot ফিল্ড (স্ক্রিন-রিডার ও ইউজারের কাছে অদৃশ্য) ── */}
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                autoComplete="off"
                tabIndex={-1}
                className="hidden"
                aria-hidden="true"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    maxLength={80}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    disabled={submitting}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200/80 dark:border-gray-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm outline-none transition-all disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Your Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    maxLength={100}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    disabled={submitting}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200/80 dark:border-gray-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm outline-none transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  maxLength={150}
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Project Collaboration"
                  disabled={submitting}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200/80 dark:border-gray-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm outline-none transition-all disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  maxLength={2000}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Hello, I'd like to talk about..."
                  disabled={submitting}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200/80 dark:border-gray-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm outline-none transition-all resize-none disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>

      </div>

    </section>
  );
};

export default ContactHomePage;