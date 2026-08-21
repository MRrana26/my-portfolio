"use client";

import React, { useState } from "react";
import { 
  FolderKanban, 
  Globe, 
  Sparkles 
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

const ProjectsHomePage = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  // ── Project Data ──
  const projects = [
    {
      id: 1,
      title: "Ettehad Member Management & Investment...",
      category: "fullstack",
      description: "Ittehad Assets Limited is a trust, savings and investment-based organization, where the financial security and long-term prosperity of its members are given utmost importance. Through transparency, accountability and mutual cooperation, we are working to build a strong and sustainable financial community.",
      image: "https://i.ibb.co.com/m5fzn0XT/Screenshot-2026-08-20-065111.png",
      techStack: ["Next.js", "React", "MongoDB", "Express", "Tailwind CSS"],
      liveLink: "https://ettehadassetsltd.com",
      githubLink: "https://github.com/MRrana26",
      featured: true,
    },
    {
      id: 2,
      title: "PromptVerse",
      category: "fullstack",
      description: "Discover & Share Next-Gen AI Prompts",
      image: "https://i.ibb.co.com/My2YR2GP/Screenshot-2026-08-20-065556.png",
      techStack: ["React", "Node.js", "Express", "Firebase", "Tailwind CSS"],
      liveLink: "https://ai-prompt-marketplace-assignment-10.vercel.app",
      githubLink: "https://github.com/MRrana26/ai-prompt-marketplace-assignment-10",
      featured: true,
    },
    {
      id: 3,
      title: "Al-Wakilu Travels",
      category: "frontend",
      description: "Trusted Hajj, Umrah, visa, and travel services — guiding your journey with care, transparency, and premium support at every step.",
      image: "https://i.ibb.co.com/JFk9v03F/Screenshot-2026-08-20-070240.png",
      techStack: ["Next.js 16", "React", "Tailwind CSS", "Lucide Icons"],
      liveLink: "https://al-wakilu-travels.vercel.app",
      githubLink: "https://github.com/MRrana26",
      featured: false,
    },
    {
      id: 4,
      title: "GitHub Issues Tracker",
      category: "Frontend",
      description: "Track and manage your project issues",
      image: "https://i.ibb.co.com/VfdgYB3/Screenshot-2026-08-20-071053.png",
      techStack: ["Node.js", "Express", "Firebase", "MongoDB"],
      liveLink: "https://mrrana26.github.io/assignment-5/dashboard.html",
      githubLink: "https://github.com/MRrana26/assignment-5",
      featured: false,
    },
  ];

  // ── Categories ──
  const categories = [
    { id: "all", label: "All Projects" },
    { id: "fullstack", label: "Full Stack" },
    { id: "frontend", label: "Frontend" },
    { id: "backend", label: "Backend API" },
  ];

  // ── Filter Projects ──
  const filteredProjects = activeCategory === "all" 
    ? projects 
    : projects.filter(p => p.category === activeCategory);

  return (
    <section className="w-full max-w-6xl mx-auto my-12 p-6 sm:p-10 bg-white dark:bg-gray-900/80 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all duration-300">
      
      {/* ── Section Header ── */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
          <FolderKanban className="w-3.5 h-3.5" /> Featured Work
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Recent Projects
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          A collection of web applications and digital solutions I have designed and developed.
        </p>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 scale-105"
                  : "bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Projects Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="group flex flex-col justify-between bg-gray-50/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5"
          >
            {/* Image Banner */}
            <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-gray-200 dark:bg-gray-900">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {project.featured && (
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-md shadow-sm">
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              )}
            </div>

            {/* Details */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                  {project.description}
                </p>
              </div>

              {/* Tech Badges */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {project.techStack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/60">
                <a
                  href={project.liveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all"
                >
                  <Globe className="w-3.5 h-3.5" /> Live Demo
                </a>
                <a
                  href={project.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center p-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200/60 dark:border-gray-600/50 transition-all"
                  aria-label="GitHub Repository"
                >
                  <FaGithub className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
};

export default ProjectsHomePage;