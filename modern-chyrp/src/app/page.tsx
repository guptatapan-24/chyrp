"use client";
import ThemeSwitcher from "../../components/ThemeSwitcher";
import CreatePost from "../../components/CreatePost";
import PostListInfinite from "../../components/PostListInfinite";
import CreateQuote from "../../components/CreateQuote";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <motion.div
      className="max-w-4xl mx-auto p-6 bg-gray-50 dark:bg-[#22223B] min-h-screen transition-colors"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
    >
      <header className="mb-8 flex items-center justify-between">
        <h1 className="font-extrabold text-3xl md:text-4xl text-indigo-700 dark:text-indigo-300 tracking-tight transition-colors">Modern Chyrp Blog</h1>
        <ThemeSwitcher />
      </header>
      <CreatePost />
      <CreateQuote />
      <PostListInfinite />
    </motion.div>
  );
}
