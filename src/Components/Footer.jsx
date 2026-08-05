"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  MdArrowUpward
} from "react-icons/md";
import { 
  FaGithub, 
  FaLinkedin, 
  FaTwitter, 
  FaFacebook, 
  FaYoutube,
  FaHeart
} from "react-icons/fa";
import { 
  FiSend 
} from "react-icons/fi";

const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
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
    { name: "GitHub", icon: FaGithub, href: "https://github.com/masudur-rahman" },
    { name: "LinkedIn", icon: FaLinkedin, href: "https://linkedin.com/in/masudur-rahman" },
    { name: "Twitter", icon: FaTwitter, href: "https://twitter.com/masudur-rahman" },
    { name: "Facebook", icon: FaFacebook, href: "https://facebook.com/masudur.rahman" },
    { name: "YouTube", icon: FaYoutube, href: "https://youtube.com/@masudur-rahman" },
  ];

  // ── Scroll to Top ──
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Handle Scroll ──
  useEffect(() => {
    if (!mounted) return;
    
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  // যদি mounted না হয়, তাহলে কিছু রেন্ডার করবেন না (হাইড্রেশন মিসম্যাচ প্রতিরোধ)
  if (!mounted) {
    return (
      <footer className="relative bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Placeholder content */}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      
      {/* ── Main Footer ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* ── Column 1: Brand & About ── */}
          <div className="space-y-4">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-blue-500/20 dark:ring-blue-400/30 transition-all group-hover:ring-4 group-hover:ring-blue-500/30">
                <span className="text-white font-bold text-sm">MR</span>
              </div>
              <span className="font-bold text-lg dark:text-white">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  MASUDUR
                </span>
                <span className="text-gray-600 dark:text-gray-300"> RAHMAN</span>
              </span>
            </Link>

            {/* About Text */}
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Passionate about creating beautiful, functional, and user-friendly applications. 
              I turn complex problems into simple, elegant solutions with modern technologies.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <MdPhone className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <a href="tel:+8801946228026" className="hover:underline">
                  +880 1946-228026
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <MdEmail className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <a href="mailto:hafezmasudranamn@gmail.com" className="hover:underline">
                  hafezmasudranamn@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <MdLocationOn className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* ── Column 2: Quick Links ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:translate-x-1"
                    >
                      <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Column 3: Services ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Services
            </h3>
            <ul className="space-y-2.5">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <li key={service.name}>
                    <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Icon className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      {service.name}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Availability Badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                Available for work
              </span>
            </div>
          </div>

          {/* ── Column 4: Social & Newsletter ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Connect With Me
            </h3>
            
            {/* Social Links */}
            <div className="flex flex-wrap gap-3 mb-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
                    aria-label={social.name}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>

            {/* Newsletter */}
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Subscribe to get updates
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-1"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  Subscribe
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Copyright */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              &copy; {currentYear} Masudur Rahman. All rights reserved.
            </p>

            {/* Made with love */}
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              Develop by MASUDUR RAHMAN
            </p>
          </div>
        </div>
      </div>

      {/* ── Scroll to Top Button ── */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 group"
          aria-label="Scroll to top"
        >
          <MdArrowUpward className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}
    </footer>
  );
};

export default Footer;