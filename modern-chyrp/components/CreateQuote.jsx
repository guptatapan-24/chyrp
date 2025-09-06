"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import { motion } from "framer-motion";

export default function QuoteCreatorBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [author, setAuthor] = useState("");
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (formData) => api.post("/posts", formData),
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
      setQuoteText("");
      setAuthor("");
      setIsExpanded(false);
    },
    onError: () => {
      alert("Failed to add quote. Please try again.");
    },
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!quoteText.trim()) {
      alert("Please enter a quote.");
      return;
    }
    if (!session?.user?.id) {
      alert("You must be logged in to add a quote.");
      return;
    }
    const formData = new FormData();
    formData.append("title", "Quote"); // Can customize
    formData.append("markdown", quoteText);
    formData.append("user_id", session.user.id);
    formData.append("type", "quote");
    if (author.trim()) formData.append("tags", JSON.stringify([author.trim()]));
    mutation.mutate(formData);
  }

  const isUserLoggedIn = status === "authenticated" && !!session?.user?.id;

  return (
    <div className="max-w-3xl mx-auto mb-6">
      {!isExpanded ? (
        <div
          className="border rounded px-4 py-2 text-gray-600 dark:text-gray-300 cursor-text bg-white dark:bg-gray-800"
          onClick={() => setIsExpanded(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setIsExpanded(true)}
        >
          Add a Quote...
        </div>
      ) : (
        <motion.form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md flex flex-col gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <textarea
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            placeholder="Enter quote"
            rows={4}
            className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 transition dark:bg-gray-800 dark:text-white"
            disabled={mutation.isLoading}
            required
          />
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author (optional)"
            className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition dark:bg-gray-800 dark:text-white"
            disabled={mutation.isLoading}
          />
          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={!isUserLoggedIn || mutation.isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded transition disabled:opacity-50"
            >
              {mutation.isLoading ? "Adding..." : "Add Quote"}
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:underline"
              disabled={mutation.isLoading}
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}
    </div>
  );
}
