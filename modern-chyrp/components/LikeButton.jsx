"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import api from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { HeartIcon } from "@heroicons/react/24/solid";

export default function LikeButton({ id, count }) {
  const [likes, setLikes] = useState(count || 0);
  const [clicked, setClicked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const { data: session } = useSession();

  // Sync likes if count prop changes
  useEffect(() => {
    setLikes(count || 0);
  }, [count]);

  // Check if user already liked the post when session or id changes
  useEffect(() => {
    async function fetchLikedStatus() {
      if (session?.user?.id) {
        try {
          const res = await api.get(`/posts/${id}/liked-by/${session.user.id}`);
          setLiked(res.data.liked);
        } catch {
          setLiked(false); // On error, allow liking
        }
      } else {
        setLiked(false);
      }
    }
    fetchLikedStatus();
  }, [id, session?.user?.id]);

  async function handleLike() {
    console.log('LikeButton post id:', id);
  if (!id) {
    console.warn("Invalid post id detected; aborting.");
    return;
  }
    if (submitting || !session?.user?.id || liked) return;

    setSubmitting(true);
    setClicked(true);
    setLikes((prev) => prev + 1); // optimistic UI

    try {
      const formData = new FormData();
      formData.append("user_id", session.user.id.toString());

      await api.post(`/posts/${id}/like`, formData);
      setLiked(true); // disable like after success
    } catch (err) {
      console.error("Failed to like post:", err);
      setLikes((prev) => prev - 1); // revert like on failure
    } finally {
      setTimeout(() => {
        setClicked(false);
        setSubmitting(false);
      }, 300);
    }
  }

  return (
    <motion.button
      onClick={handleLike}
      disabled={submitting || !session?.user?.id || liked}
      type="button"
      aria-label="Like post"
      className={`flex items-center gap-1 text-red-600 dark:text-red-400 font-medium transition-transform duration-150 ${
        clicked ? "scale-110" : ""
      } disabled:opacity-60 disabled:cursor-not-allowed`}
      whileTap={{ scale: 1.2 }}
    >
      <AnimatePresence>
        <motion.div
          key={clicked ? "clicked" : "unclicked"}
          initial={{ scale: 1 }}
          animate={{ scale: clicked ? 1.4 : 1 }}
          exit={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <HeartIcon className="h-6 w-6" />
        </motion.div>
      </AnimatePresence>
      <span className="text-sm">{likes}</span>
    </motion.button>
  );
}
