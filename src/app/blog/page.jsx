"use client";

import React, { useState } from "react";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Tag, 
  Sparkles 
} from "lucide-react";

const BlogsHomePage = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  // ── Blog Posts Data ──
  const blogPosts = [
    {
      id: 1,
      title: "Mastering Next.js 15 Server Components and Actions",
      slug: "mastering-nextjs-server-components",
      category: "react",
      excerpt: "Explore how Next.js App Router leverages Server Components to reduce bundle sizes and improve core web vitals.",
      coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop",
      date: "Aug 12, 2026",
      readTime: "5 min read",
      featured: true,
    },
    {
      id: 2,
      title: "Building Scalable REST APIs with Node.js & Express",
      slug: "scalable-rest-apis-nodejs-express",
      category: "backend",
      excerpt: "Best practices for structuring Express applications, implementing JWT authentication, and managing MongoDB schemas.",
      coverImage: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=800&auto=format&fit=crop",
      date: "Jul 28, 2026",
      readTime: "7 min read",
      featured: true,
    },
    {
      id: 3,
      title: "Tailwind CSS v4: Key Features & Performance Gains",
      slug: "tailwind-css-v4-features",
      category: "frontend",
      excerpt: "A deep dive into the new engine of Tailwind CSS v4, dynamic values, and lightning-fast build speeds.",
      coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=800&auto=format&fit=crop",
      date: "Jun 15, 2026",
      readTime: "4 min read",
      featured: false,
    },
  ];

  // ── Categories ──
  const categories = [
    { id: "all", label: "All Posts" },
    { id: "react", label: "React / Next.js" },
    { id: "frontend", label: "Frontend UI" },
    { id: "backend", label: "Backend API" },
  ];

  // ── Filter Blogs ──
  const filteredPosts = activeCategory === "all"
    ? blogPosts
    : blogPosts.filter(post => post.category === activeCategory);

  return (
    <section className="w-full max-w-6xl mx-auto my-12 p-6 sm:p-10 bg-white dark:bg-gray-900/80 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all duration-300">
      
      {/* ── Section Header ── */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
          <BookOpen className="w-3.5 h-3.5" /> Articles & Insights
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Latest Blog Posts
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Thoughts, tutorials, and insights about web development, JavaScript, and software engineering.
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

      {/* ── Blog Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="group flex flex-col justify-between bg-gray-50/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5"
          >
            {/* Image & Badges */}
            <div className="relative w-full h-48 overflow-hidden bg-gray-200 dark:bg-gray-900">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {post.featured && (
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-md shadow-sm">
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              )}
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                
                {/* Meta Details */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    {post.date}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500" />
                    {post.readTime}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              {/* Read More Link */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700/60">
                <a
                  href={`/blogs/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group/link"
                >
                  Read Full Article
                  <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

          </article>
        ))}
      </div>

    </section>
  );
};

export default BlogsHomePage;