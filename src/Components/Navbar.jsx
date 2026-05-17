"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Moon, Sun } from "lucide-react";

const Navbar = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeItem, setActiveItem] = useState("Home");

  // More dropdown items
  const moreItems = [
    "Blog",
    "Achievements",
    "Recommendations",
    "Hobbies"
  ];

  // Main nav items
  const navItems = [
    "Home",
    "TechStack",
    "Qualification",
    "Projects",
    "Contact Me"
  ];

  // Handle scroll effect for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
        setIsMoreOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <nav
        className={`
          sticky top-0 z-50 w-full transition-all duration-300
          ${scrolled 
            ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg" 
            : "bg-white dark:bg-gray-900"
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo - Left Side */}
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">MR</span>
                </div>
                <span className="font-bold text-xl dark:text-white hidden sm:block">
                  Portfolio
                </span>
              </div>
            </div>

            {/* Center Navigation - Desktop (Hidden on mobile) */}
            <div className="hidden md:flex items-center justify-center space-x-1 lg:space-x-2">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveItem(item)}
                  className={`
                    relative px-3 lg:px-4 py-2 rounded-full text-sm lg:text-base font-medium
                    transition-all duration-300 ease-in-out
                    ${activeItem === item
                      ? "text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  {item}
                  {/* iPhone-style background transformer effect */}
                  {activeItem === item && (
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 -z-10 animate-pulse-subtle" />
                  )}
                </button>
              ))}
              
              {/* More Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={`
                    flex items-center space-x-1 px-3 lg:px-4 py-2 rounded-full text-sm lg:text-base font-medium
                    transition-all duration-300
                    ${isMoreOpen || activeItem === "More"
                      ? "text-white bg-gradient-to-r from-blue-500 to-purple-600"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <span>More</span>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-200 ${isMoreOpen ? "rotate-180" : ""}`}
                  />
                </button>
                
                {/* Dropdown Menu */}
                {isMoreOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
                    {moreItems.map((item) => (
                      <button
                        key={item}
                        onClick={() => {
                          setActiveItem(item);
                          setIsMoreOpen(false);
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Dark Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`
                  p-2 rounded-full transition-all duration-300
                  ${isDarkMode 
                    ? "bg-gray-800 text-yellow-400 hover:bg-gray-700" 
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }
                `}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 animate-slideDown">
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setActiveItem(item);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    block w-full text-left px-4 py-3 rounded-xl text-base font-medium
                    transition-all duration-300
                    ${activeItem === item
                      ? "text-white bg-gradient-to-r from-blue-500 to-purple-600"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  {item}
                </button>
              ))}
              
              {/* More items in mobile */}
              <div className="pt-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 pb-2">
                  MORE OPTIONS
                </div>
                {moreItems.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setActiveItem(item);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-pulse-subtle {
          animation: pulseSubtle 2s infinite;
        }
      `}</style>
    </>
  );
};

export default Navbar;