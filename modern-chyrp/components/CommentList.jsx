"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import api from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { getAvatarUrl } from "../utils/avatar";

// Utility to generate random avatar URL
const getRandomAvatar = (seed) =>
  `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed}&radius=50&backgroundType=gradientLinear`;

// Fetch one page of comments
const fetchCommentsPage = async ({ postId, pageParam = 1 }) => {
  const res = await api.get(`/posts/${postId}/comments?page=${pageParam}`);
  return res.data;
};

// Post comment function
const postComment = async ({ postId, text, userId }) => {
  const formData = new FormData();
  formData.append("text", text);
  formData.append("user_id", userId);
  return api.post(`/posts/${postId}/comments`, formData);
};

export default function CommentList({ postId }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  // Infinite Query for paginated comments
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: ({ pageParam = 1 }) => fetchCommentsPage({ postId, pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!postId,
  });

  // Automatically fetch next page when in view
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Mutation for posting comment
  const mutation = useMutation({
    mutationFn: postComment,
    onSuccess: () => {
      // Invalidate comments cache to refetch fresh
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const [commentText, setCommentText] = useState("");

  // Submit comment handler
  async function submitComment(e) {
    e.preventDefault();
    if (!commentText.trim() || !session?.user?.id) return;
    mutation.mutate({ postId, text: commentText, userId: session.user.id });
    setCommentText("");
  }

  // Flatten pages to a single comments array
  const comments = data?.pages.flatMap(page => page.comments) ?? [];

  return (
    <motion.div
      className="mt-8 w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">💬 Comments</h3>

      {isLoading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading comments...</p>
      ) : error ? (
        <p className="text-red-500">Failed to load comments.</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                className="flex items-start gap-3 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <img
  src={getAvatarUrl(comment.username || comment.user_id || comment.id)}
  alt="User Avatar"
  className="w-10 h-10 rounded-full"
/>
                <div>
                  <p className="text-gray-800 dark:text-gray-100">{comment.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{comment.username}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={ref} className="text-center py-2">
            {isFetchingNextPage ? "Loading more comments..." : hasNextPage ? "" : "No more comments"}
          </div>
        </div>
      )}

      {/* Comment Form */}
      <form onSubmit={submitComment} className="mt-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write your comment..."
          className="flex-grow border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
          disabled={mutation.isLoading}
        />
        <button
          type="submit"
          disabled={
            mutation.isLoading || !commentText.trim() || !session?.user?.id
          }
          className={`px-5 py-2 rounded text-white transition duration-200 ${
            mutation.isLoading || !commentText.trim() || !session?.user?.id
              ? "bg-green-300 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {mutation.isLoading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </motion.div>
  );
}
