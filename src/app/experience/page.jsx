"use client";

import React from "react";
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  Award
} from "lucide-react";

const ExperienceHomePage = () => {
  // ── Experience Data ──
  const experienceData = [
    {
      title: "Full Stack Web Developer",
      company: "Ettehad",
      location: "Dhaka, Bangladesh",
      period: "2025 - Present",
      description: "Building scalable web applications using React.js, Next.js, Node.js, Express, and MongoDB.",
    },
    {
      title: "Frontend Developer (React)",
      company: "Freelance & Projects",
      location: "Remote",
      period: "2024 - Present",
      description: "Developed modern UI/UX interfaces with Tailwind CSS, Redux Toolkit, and Firebase integration.",
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto my-12 p-6 sm:p-10 bg-white dark:bg-gray-900/80 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all duration-300">
      
      {/* ── Section Header ── */}
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
          <Award className="w-3.5 h-3.5" /> My Journey
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Work Experience
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          My professional work experience and career timeline.
        </p>
      </div>

      {/* ── Timeline Display ── */}
      <div className="relative max-w-3xl mx-auto pl-6 sm:pl-8 border-l-2 border-blue-100 dark:border-gray-800 space-y-8 sm:space-y-10">
        {experienceData.map((item, index) => (
          <div key={index} className="relative group">
            
            {/* Timeline Dot Icon */}
            <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-8 h-8 rounded-full bg-white dark:bg-gray-900 border-2 border-blue-600 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <Briefcase className="w-4 h-4" />
            </div>

            {/* Content Card */}
            <div className="p-5 sm:p-6 bg-gray-50/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 space-y-2">
              
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
                  <Calendar className="w-3 h-3" />
                  {item.period}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
                  {item.company}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {item.location}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 pt-1 leading-relaxed">
                {item.description}
              </p>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
};

export default ExperienceHomePage;