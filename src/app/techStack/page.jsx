"use client";

import React, { useState } from "react";
// Lucide Icons
import { 
  Code2, 
  Laptop, 
  Wrench, 
  Layers, 
  Atom, 
  Globe, 
  FileCode2, 
  Palette, 
  Server, 
  Database, 
  Flame, 
  GitBranch, 
  FolderGit2, 
  Send,
  Boxes
} from "lucide-react";

const TechStack = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  // ── Tech Data List ──
  const technologies = [
    // Frontend
    { name: "React.js", category: "frontend", icon: Atom, color: "text-sky-400", level: "Expert" },
    { name: "Next.js", category: "frontend", icon: Globe, color: "text-black dark:text-white", level: "Expert" },
    { name: "JavaScript (ES6+)", category: "frontend", icon: FileCode2, color: "text-yellow-500", level: "Expert" },
    { name: "TypeScript", category: "frontend", icon: Code2, color: "text-blue-500", level: "Intermediate" },
    { name: "Tailwind CSS", category: "frontend", icon: Palette, color: "text-teal-400", level: "Expert" },
    { name: "Redux Toolkit", category: "frontend", icon: Boxes, color: "text-purple-500", level: "Intermediate" },
    { name: "HTML5 & CSS3", category: "frontend", icon: FileCode2, color: "text-orange-500", level: "Expert" },

    // Backend & Database
    { name: "Node.js", category: "backend", icon: Server, color: "text-green-500", level: "Intermediate" },
    { name: "Express.js", category: "backend", icon: Code2, color: "text-gray-600 dark:text-gray-300", level: "Intermediate" },
    { name: "MongoDB", category: "backend", icon: Database, color: "text-emerald-500", level: "Intermediate" },
    { name: "Firebase", category: "backend", icon: Flame, color: "text-amber-500", level: "Expert" },

    // Tools & Version Control
    { name: "Git", category: "tools", icon: GitBranch, color: "text-orange-600", level: "Expert" },
    { name: "GitHub", category: "tools", icon: FolderGit2, color: "text-gray-900 dark:text-white", level: "Expert" },
    { name: "Postman", category: "tools", icon: Send, color: "text-orange-500", level: "Intermediate" },
  ];

  // ── Categories ──
  const categories = [
    { id: "all", label: "All Skills", icon: Layers },
    { id: "frontend", label: "Frontend", icon: Laptop },
    { id: "backend", label: "Backend", icon: Server },
    { id: "tools", label: "Tools", icon: Wrench },
  ];

  // ── Filtered Tech Items ──
  const filteredTech = activeCategory === "all" 
    ? technologies 
    : technologies.filter(tech => tech.category === activeCategory);

  return (
    <section className="w-full max-w-6xl mx-auto my-8 p-6 sm:p-10 bg-white dark:bg-gray-900/90 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all duration-300">
      
      {/* ── Section Header ── */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
          <Code2 className="w-3.5 h-3.5" /> My Technologies
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Tech Stack & Skills
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Technologies, frameworks, and tools I use to build scalable web & mobile applications.
        </p>
      </div>

      {/* ── Category Filter Buttons ── */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 scale-105"
                  : "bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Grid Area ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredTech.map((tech) => {
          const Icon = tech.icon;
          return (
            <div
              key={tech.name}
              className="group relative p-4 bg-gray-50/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5 flex flex-col items-center justify-center text-center space-y-3"
            >
              {/* Icon Holder */}
              <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-xs group-hover:scale-110 transition-transform duration-300">
                <Icon className={`w-7 h-7 ${tech.color}`} />
              </div>

              {/* Title & Level Badge */}
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {tech.name}
                </h3>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  {tech.level}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};

export default TechStack;