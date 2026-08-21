"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Firebase Imports
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import {
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdCode,
  MdWork,
  MdPeople,
  MdEmojiEvents,
  MdMenuBook,
  MdThumbUp,
  MdFolder,
  MdSchool,
  MdHome,
  MdArrowUpward,
  MdCheckCircle
} from "react-icons/md";
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaYoutube,
  FaHeart,
  FaSpinner
} from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import Image from "next/image";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBSCRIBE_COOLDOWN_MS = 30_000; // ৩০ সেকেন্ড rate-limit

const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState(""); // বট-ট্র্যাপ ফিল্ড
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const lastSubscribeRef = useRef(0);
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // ── Quick Links ──
  const quickLinks = [
    { name: "Home", href: "/", icon: MdHome },
    { name: "TechStack", href: "/techstack", icon: MdCode },
    { name: "Qualification", href: "/qualification", icon: MdSchool },
    { name: "Projects", href: "/projects", icon: MdFolder },
    { name: "Blog", href: "/blog", icon: MdMenuBook },
    { name: "Achievements", href: "/achievements", icon: MdEmojiEvents },
    { name: "Recommendations", href: "/recommendations", icon: MdThumbUp },
  ];

  // ── Services ──
  const services = [
    { name: "Web Development", icon: MdCode },
    { name: "App Development", icon: MdWork },
    { name: "UI/UX Design", icon: MdPeople },
    { name: "Consultation", icon: MdEmojiEvents },
  ];

  // ── Social Links ──
  const socialLinks = [
    { name: "GitHub", icon: FaGithub, href: "https://github.com/MRrana26" },
    { name: "LinkedIn", icon: FaLinkedin, href: "https://www.linkedin.com/in/dev-masudur-rahman" },
    { name: "Twitter", icon: FaTwitter, href: "https://x.com/MASUDURRAH73320" },
    { name: "Facebook", icon: FaFacebook, href: "https://facebook.com/MrRana26" },
    { name: "YouTube", icon: FaYoutube, href: "https://www.youtube.com/@mr.masud26" },
  ];

  // ── Scroll to Top ──
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Handle Scroll Event ──
  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  // ── Firestore Newsletter Handle (এখন honeypot + validation + rate-limit সহ) ──
  const handleSubscribe = async (e) => {
    e.preventDefault();

    // ── Honeypot: বট এই ফিল্ড পূরণ করে ফেলবে, মানুষ দেখতেই পাবে না ──
    if (honeypot.trim() !== "") return;

    const trimmedEmail = email.trim().toLowerCase();

    // ── Email ফরম্যাট ভ্যালিডেশন ──
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      alert("অনুগ্রহ করে সঠিক ইমেইল ঠিকানা দিন।");
      return;
    }

    // ── Rate limit (client-side) ──
    const now = Date.now();
    if (now - lastSubscribeRef.current < SUBSCRIBE_COOLDOWN_MS) {
      alert("অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
      return;
    }

    setSubscribing(true);
    try {
      // Firebase Firestore-এর 'subscribers' কালেকশনে সেভ করা হচ্ছে
      await addDoc(collection(db, "subscribers"), {
        email: trimmedEmail,
        subscribedAt: serverTimestamp(),
      });

      lastSubscribeRef.current = now;
      setSubscribed(true);
      setEmail("");
      setHoneypot("");
      setTimeout(() => setSubscribed(false), 5000);
    } catch (error) {
      console.error("Error adding subscriber: ", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  // Dashboard বা নির্দিষ্ট পেইজে ফুটার হাইড করা
  if (pathname?.includes('dashboard')) {
    return null;
  }

  return (
    <footer className="relative bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">

      {/* ── Main Footer Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* ── Column 1: Brand & Contact ── */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center space-x-2 group">
              <div className="flex items-center gap-3">
                <Image
                  src={'/masud-profile.png'}
                  alt="Masudur Rahman"
                  width={40}
                  height={40}
                  className="rounded-full object-cover border-2 border-blue-500"
                />
              </div>
              <span className="font-bold text-lg dark:text-white">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  MASUDUR
                </span>
                <span className="text-gray-700 dark:text-gray-200"> RAHMAN</span>
              </span>
            </Link>

            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Passionate about creating beautiful, functional, and user-friendly applications.
              I turn complex problems into simple, elegant solutions with modern web technologies.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <MdPhone className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <a href="tel:+8801946228026" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  +880 1946-228026
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <MdEmail className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <a href="mailto:hafezmasudranamn@gmail.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  hafezmasudranamn@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <MdLocationOn className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* ── Column 2: Quick Links ── */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:translate-x-1"
                    >
                      <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Column 3: Services ── */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">
              Services
            </h3>
            <ul className="space-y-2.5">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <li key={service.name}>
                    <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      {service.name}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Availability Badge */}
            <div className="mt-6 inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Available for projects
              </span>
            </div>
          </div>

          {/* ── Column 4: Social & Newsletter ── */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">
              Connect With Me
            </h3>

            {/* Social Links */}
            <div className="flex flex-wrap gap-2.5 mb-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white transition-all duration-300 hover:scale-110 shadow-sm"
                    aria-label={social.name}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>

            {/* Newsletter Subscription */}
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Subscribe to receive latest articles & project updates.
              </p>

              {subscribed ? (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <MdCheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Thanks for subscribing!</span>
                </div>
              ) : (
                <form className="flex gap-2" onSubmit={handleSubscribe}>
                  {/* ── Honeypot ফিল্ড (স্ক্রিন-রিডার ও ইউজারের কাছে অদৃশ্য) ── */}
                  <input
                    type="text"
                    name="company_website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    autoComplete="off"
                    tabIndex={-1}
                    className="hidden"
                    aria-hidden="true"
                  />

                  <input
                    type="email"
                    required
                    maxLength={100}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                    disabled={subscribing}
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg hover:opacity-90 transition-all flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {subscribing ? (
                      <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FiSend className="w-3.5 h-3.5" />
                    )}
                    <span>{subscribing ? "Joining..." : "Join"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-gray-200 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              &copy; {currentYear} <span className="font-semibold text-gray-700 dark:text-gray-300">Masudur Rahman</span>. All rights reserved.
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span>Developed with</span>
              <FaHeart className="w-3 h-3 text-rose-500 animate-pulse" />
              <span>by <strong className="text-gray-700 dark:text-gray-300 font-semibold">MASUDUR RAHMAN</strong></span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Floating Scroll to Top Button ── */}
      {mounted && showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-110 active:scale-95 z-50 group"
          aria-label="Scroll to top"
        >
          <MdArrowUpward className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}
    </footer>
  );
};

export default Footer;