"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from "react";
import { Menu, X, ChevronDown, Moon, Sun, Home, Code, GraduationCap, FolderKanban, Mail, User, BookOpen, Award, ThumbsUp, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: Home },
  { name: "TechStack", href: "/techstack", icon: Code },
  { name: "Qualification", href: "/qualification", icon: GraduationCap },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Contact Me", href: "/contact", icon: Mail },
];

const MORE_ITEMS = [
  { name: "Blog", href: "/blog", icon: BookOpen },
  { name: "Achievements", href: "/achievements", icon: Award },
  { name: "Recommendations", href: "/recommendations", icon: ThumbsUp },
  { name: "Hobbies", href: "/hobbies", icon: Heart },
];

const STORAGE_KEY = "theme-preference";

const Navbar = () => {
  // ── State Management ──
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeItem, setActiveItem] = useState("Home");
  const [isHydrated, setIsHydrated] = useState(false);

  // ── Refs ──
  const moreDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const moreButtonRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // ── Hooks ──
  const pathname = usePathname();
  const router = useRouter();

  // ── Memoized Values ──
  const allNavItems = useMemo(() => [...NAV_ITEMS, ...MORE_ITEMS], []);

  // ── useLayoutEffect for hydration - Synchronous theme initialization ──
  useLayoutEffect(() => {
    // Calculate theme before any setState
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (savedTheme === null && systemPrefersDark);
    
    // Apply theme to DOM synchronously (doesn't trigger setState)
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Update React state once after DOM operations
    setIsDarkMode(shouldBeDark);
    setIsHydrated(true);
  }, []);

  // ── Active Item Detection ──
  useEffect(() => {
    if (!isHydrated || !pathname) return;

    // First try exact match
    let matchedItem = allNavItems.find(item => item.href === pathname);
    
    // If no exact match, try partial match
    if (!matchedItem) {
      matchedItem = allNavItems.find(item => {
        if (item.href === "/") return false;
        return pathname.startsWith(item.href);
      });
    }
    
    if (matchedItem) {
      setActiveItem(matchedItem.name);
    } else if (pathname === "/") {
      setActiveItem("Home");
    }
  }, [pathname, allNavItems, isHydrated]);

  // ── Scroll Effect with optimized debouncing ──
  useEffect(() => {
    if (!isHydrated) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) return;
      
      scrollTimeoutRef.current = setTimeout(() => {
        const isScrolled = window.scrollY > 10;
        setScrolled(isScrolled);
        scrollTimeoutRef.current = null;
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isHydrated]);

  // ── Dark Mode Toggle ──
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem(STORAGE_KEY, newMode ? "dark" : "light");
      
      if (newMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      
      return newMode;
    });
  }, []);

  // ── Navigation Handler ──
  const handleNavClick = useCallback((item) => {
    setActiveItem(item.name);
    setIsMobileMenuOpen(false);
    setIsMoreOpen(false);
    
    if (item.href) {
      router.push(item.href);
    }
  }, [router]);

  // ── Click Outside Handler ──
  useEffect(() => {
    if (!isHydrated) return;

    const handleClickOutside = (event) => {
      // Close more dropdown
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target) && 
          moreButtonRef.current && !moreButtonRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
      
      // Close mobile menu
      if (isMobileMenuOpen && window.innerWidth < 768) {
        const navElement = event.target.closest('nav');
        if (!navElement) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen, isHydrated]);

  // ── Escape Key Handler ──
  useEffect(() => {
    if (!isHydrated) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isHydrated]);

  // ── Prevent Body Scroll on Mobile Menu ──
  useEffect(() => {
    if (!isHydrated) return;

    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen, isHydrated]);

  // ── Handle Window Resize ──
  useEffect(() => {
    if (!isHydrated) return;

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
        setIsMoreOpen(false);
        document.body.style.overflow = "unset";
      }
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isHydrated]);

  // ── Hydration Mismatch Prevention ──
  if (!isHydrated) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600" />
                <span className="font-bold text-lg dark:text-white hidden sm:block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    MASUDUR
                  </span>
                  <span className="text-gray-600 dark:text-gray-300"> RAHMAN</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800" />
              <div className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav
        className={`
          sticky top-0 z-50 w-full transition-all duration-300
          ${scrolled 
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg" 
            : "bg-white dark:bg-gray-900"
          }
          border-b border-gray-200/50 dark:border-gray-800/50
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* ── Logo ── */}
            <div className="shrink-0">
              <Link 
                href="/" 
                className="flex items-center space-x-2 group"
                aria-label="Go to homepage"
                onClick={() => setActiveItem("Home")}
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-blue-500/20 dark:ring-blue-400/30 transition-all group-hover:ring-4 group-hover:ring-blue-500/30">
                  <Image 
                    src="/masud.jpeg" 
                    width={36} 
                    height={36} 
                    alt="Masudur Rahman" 
                    className="object-cover"
                    priority
                  />
                </div>
                <span className="font-bold text-lg dark:text-white hidden sm:block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    MASUDUR
                  </span>
                  <span className="text-gray-600 dark:text-gray-300"> RAHMAN</span>
                </span>
                <span className="font-bold text-sm dark:text-white block sm:hidden">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    MR
                  </span>
                </span>
              </Link>
            </div>

            {/* ── Desktop Navigation ── */}
            <div className="hidden md:flex items-center justify-center space-x-1 lg:space-x-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.name;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => handleNavClick(item)}
                    className={`
                      relative flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-full text-sm lg:text-base font-medium
                      transition-all duration-300 ease-in-out
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                      ${isActive
                        ? "text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-md shadow-blue-500/20"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105"
                      }
                    `}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {Icon && <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />}
                    {item.name}
                    {isActive && (
                      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 -z-10 animate-pulse-subtle" />
                    )}
                  </Link>
                );
              })}
              
              {/* ── More Dropdown ── */}
              <div className="relative" ref={moreDropdownRef}>
                <button
                  ref={moreButtonRef}
                  onClick={() => setIsMoreOpen(prev => !prev)}
                  className={`
                    flex items-center gap-1 px-3 lg:px-4 py-2 rounded-full text-sm lg:text-base font-medium
                    transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                    ${isMoreOpen || MORE_ITEMS.some((i) => i.name === activeItem)
                      ? "text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-md shadow-blue-500/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105"
                    }
                  `}
                  aria-expanded={isMoreOpen}
                  aria-haspopup="true"
                >
                  <span>More</span>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-200 ${isMoreOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                
                {/* Dropdown Menu */}
                {isMoreOpen && (
                  <div 
                    className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-slideDown"
                    role="menu"
                  >
                    {MORE_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeItem === item.name;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => handleNavClick(item)}
                          className={`
                            flex items-center gap-3 w-full text-left px-4 py-3 text-sm transition-all duration-200
                            hover:pl-6
                            ${isActive
                              ? "bg-blue-50 dark:bg-gray-700 font-semibold text-blue-600 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }
                          `}
                          role="menuitem"
                        >
                          {Icon && <Icon className="w-4 h-4" />}
                          {item.name}
                          {isActive && (
                            <span className="ml-auto text-blue-500">●</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Side Controls ── */}
            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`
                  p-2 rounded-full transition-all duration-300
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                  ${isDarkMode 
                    ? "bg-gray-800 text-yellow-400 hover:bg-gray-700 hover:scale-110" 
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:scale-110"
                  }
                `}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {isMobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 animate-slideDown overflow-y-auto max-h-[calc(100vh-4rem)]"
            role="menu"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.name;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => handleNavClick(item)}
                    className={`
                      flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-base font-medium
                      transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${isActive
                        ? "text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-md"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                    role="menuitem"
                  >
                    {Icon && <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />}
                    {item.name}
                    {isActive && (
                      <span className="ml-auto text-white">●</span>
                    )}
                  </Link>
                );
              })}
              
              {/* More items in mobile */}
              <div className="pt-3 mt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 px-4 pb-2 tracking-wider">
                  MORE OPTIONS
                </p>
                {MORE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.name;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => handleNavClick(item)}
                      className={`
                        flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-base
                        transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${isActive
                          ? "text-white bg-gradient-to-r from-blue-500 to-purple-600 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }
                      `}
                      role="menuitem"
                    >
                      {Icon && <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />}
                      {item.name}
                      {isActive && (
                        <span className="ml-auto text-white">●</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Global Styles ── */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseSubtle {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .animate-slideDown {
          animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .animate-pulse-subtle {
          animation: pulseSubtle 2s ease-in-out infinite;
        }
        
        /* Smooth scroll for the whole page */
        html {
          scroll-behavior: smooth;
        }
        
        /* Better focus styles */
        *:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        /* Dark mode scrollbar */
        .dark ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .dark ::-webkit-scrollbar-track {
          background: #1f2937;
        }
        .dark ::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }
        .dark ::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </>
  );
};

export default Navbar;