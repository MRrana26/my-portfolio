"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Code, Smartphone, GraduationCap, Lightbulb, Briefcase, Users, Download } from "lucide-react";
import Image from "next/image";

const Hero = () => {
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const roles = [
    "Web Developer",
    "App Developer",
    "Teacher",
    "Problem Solver"
  ];

  // Typing animation effect
  useEffect(() => {
    const currentRole = roles[currentRoleIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < currentRole.length) {
          setDisplayText(currentRole.substring(0, displayText.length + 1));
        } else {
          // Wait before starting to delete
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(currentRole.substring(0, displayText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentRoleIndex((prev) => (prev + 1) % roles.length);
        }
      }
    }, isDeleting ? 50 : 100);
    
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentRoleIndex, roles]);

  // Experience data for corner cards
  const experienceCards = [
    {
      id: 1,
      title: "Years Experience",
      value: "5+",
      icon: <Briefcase className="w-5 h-5" />,
      position: "top-right"
    },
    {
      id: 2,
      title: "Projects Completed",
      value: "50+",
      icon: <Code className="w-5 h-5" />,
      position: "middle-right"
    },
    {
      id: 3,
      title: "Happy Clients",
      value: "30+",
      icon: <Users className="w-5 h-5" />,
      position: "bottom-right"
    }
  ];

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          
          {/* Left Side - Text Content */}
          <div className="flex-1 text-center lg:text-left space-y-6">
            {/* Greeting */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Available for work
            </div>

            {/* Hey I am */}
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl text-gray-600 dark:text-gray-300 font-medium">
                Hey I am,
              </h2>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                MASUDUR RAHMAN
              </h1>
              <div className="flex items-center gap-2 justify-center lg:justify-start flex-wrap">
                <span className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300">👋</span>
                <span className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300">I am a</span>
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400 min-w-[180px] border-r-2 border-blue-600 dark:border-blue-400 pr-2">
                  {displayText}
                  <span className="animate-blink">|</span>
                </span>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
              Passionate about creating beautiful, functional, and user-friendly applications. 
              I turn complex problems into simple, elegant solutions with modern technologies.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <button className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105">
                <span className="relative z-10 flex items-center gap-2">
                  Say Hello
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              
              <button className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 font-semibold hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Download CV
              </button>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 justify-center lg:justify-start pt-6">
              {["GitHub", "LinkedIn", "Twitter"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Right Side - Image with Corner Cards */}
          <div className="flex-1 relative flex justify-center">
            <div className="relative">
              {/* Main Image Container */}
              <div className="relative w-80 h-80 sm:w-96 sm:h-96 lg:w-[450px] lg:h-[450px] rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1 shadow-2xl">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {/* Replace with your actual image */}
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                    <Image src={'/masud.jpeg'} width={500} height={500} alt="Masudur Rahman"></Image>
                  </div>
                </div>
              </div>

              {/* Corner Cards */}
              {/* Top Right Corner Card */}
              <div className="absolute -top-5 -right-5 sm:-top-8 sm:-right-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 backdrop-blur-sm border border-gray-200 dark:border-gray-700 animate-float">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                    {experienceCards[0].icon}
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {experienceCards[0].value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {experienceCards[0].title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Middle Right Corner Card */}
              <div className="absolute top-1/2 -right-5 sm:-right-8 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 backdrop-blur-sm border border-gray-200 dark:border-gray-700 animate-float animation-delay-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                    {experienceCards[1].icon}
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {experienceCards[1].value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {experienceCards[1].title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Right Corner Card */}
              <div className="absolute -bottom-5 -right-5 sm:-bottom-8 sm:-right-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 backdrop-blur-sm border border-gray-200 dark:border-gray-700 animate-float animation-delay-500">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400">
                    {experienceCards[2].icon}
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {experienceCards[2].value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {experienceCards[2].title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-blink {
          animation: blink 0.8s step-end infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </section>
  );
};

export default Hero;