"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, Code2, Smartphone, Server, Palette, User } from "lucide-react";
import Image from "next/image";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import { IoIosMail } from "react-icons/io";

const Hero = () => {
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const roles = [
    "Full Stack Web Developer",
    "Android Developer",
    "Problem Solver",
    "Teacher"
  ];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const currentRole = roles[currentRoleIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentRole.length) {
          setDisplayText(currentRole.substring(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(currentRole.substring(0, displayText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentRoleIndex((prev) => (prev + 1) % roles.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentRoleIndex, roles, mounted]);

  const services = [
    {
      icon: <Code2 className="w-5 h-5 text-blue-400" />,
      iconBg: "bg-blue-500/10 border-blue-500/20",
      title: "Web Development",
      description: "Building fast, responsive and scalable websites using modern web technologies."
    },
    {
      icon: <Smartphone className="w-5 h-5 text-emerald-400" />,
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      title: "Android Development",
      description: "Creating powerful and user-friendly Android applications for businesses."
    },
    {
      icon: <Server className="w-5 h-5 text-purple-400" />,
      iconBg: "bg-purple-500/10 border-purple-500/20",
      title: "Backend Development",
      description: "Developing secure and efficient backends and RESTful APIs."
    },
    {
      icon: <Palette className="w-5 h-5 text-amber-400" />,
      iconBg: "bg-amber-500/10 border-amber-500/20",
      title: "UI/UX Design",
      description: "Designing clean, modern and intuitive user interfaces."
    }
  ];

  if (!mounted) return null;

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full space-y-12">
        
        {/* Top Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <p className="text-blue-600 dark:text-blue-400 font-medium text-lg">
              Assalamu Alaikum, I am
            </p>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
              MASUDUR
              <span className="text-blue-600 dark:text-blue-500"> RAHMAN</span>
            </h1>

            <div className="h-8 flex items-center justify-center lg:justify-start">
              <span className="text-xl sm:text-2xl font-medium text-gray-700 dark:text-gray-300">
                {displayText}
              </span>
              <span className="w-[2px] h-6 bg-blue-500 ml-1 animate-pulse"></span>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
              I build modern, responsive and user-friendly web applications and Android apps that solve real-world problems.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="/projects"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/20"
              >
                View My Work <ArrowUpRight className="w-4 h-4" />
              </a>
              <a
                href="/contact"
                className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200 font-medium flex items-center gap-2 transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              >
                Contact Me <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Social Icons */}
            <div className="flex items-center justify-center lg:justify-start gap-3 pt-4">
              {[
                { icon: <FaGithub className="w-4 h-4" />, href: "https://github.com/MRrana26" },
                { icon: <FaLinkedin  className="w-4 h-4" />, href: "https://www.linkedin.com/in/dev-masudur-rahman" },
                { icon: <FaSquareXTwitter className="w-4 h-4" />, href: "https://x.com/MASUDURRAH73320" },
                { icon: <IoIosMail className="w-4 h-4" />, href: "mailto:hafezmasudranamn@gmail.com" }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:border-blue-500/50 transition-all duration-300 bg-white dark:bg-gray-800/80"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Right Image Frame with Floating Cards */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-[380px] lg:h-[380px]">
              
              {/* Circular Gradient Background */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600/30 to-purple-600/30 blur-2xl -z-10" />
              
              {/* Profile Image Border Ring */}
              <div className="w-full h-full rounded-full border border-blue-500/30 p-3 relative flex items-center justify-center">
                <div className="w-full h-full rounded-full overflow-hidden relative bg-gray-200 dark:bg-gray-800">
                  <Image
                    src="/masud-profile.png"
                    alt="Masudur Rahman"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              {/* Floating Badge - Top Right */}
              <div className="absolute -top-2 -right-2 sm:top-2 sm:right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700/60 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <div className="text-left">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">Available for</p>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">Freelance</p>
                </div>
              </div>

              {/* Floating Badge - Bottom Left */}
              <div className="absolute -bottom-2 -left-2 sm:bottom-2 sm:left-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700/60 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">2+ Years</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Experience</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom "WHAT I DO" Section Container */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 bg-white/40 dark:bg-gray-800/20 backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Title Card */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-4 pr-0 lg:pr-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase mb-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  WHAT I DO
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-snug">
                  I build digital experiences
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 leading-relaxed">
                  I help businesses and individuals bring their ideas to life through modern web technologies and beautiful user interfaces.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href="/about"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:border-blue-500 text-xs font-medium text-gray-800 dark:text-gray-200 transition-all duration-300"
                >
                  Learn More About Me <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Right 4 Grid Cards */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/60 dark:bg-gray-900/40 hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className={`w-10 h-10 rounded-xl border ${service.iconBg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}>
                      {service.icon}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                      {service.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;