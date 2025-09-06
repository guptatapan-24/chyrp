"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import { motion } from "framer-motion";

export default function PostCreatorBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

const extractHashtags = (text) => {
  const regex = /#(\w+)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text))) {
    matches.push(match[1]);
  }
  return [...new Set(matches)]; // unique tags only
};

  const mutation = useMutation({
    mutationFn: (formData) => api.post("/posts", formData),
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
      setTitle("");
      setMarkdown("");
      setLinkUrl("");
      setFiles([]);
      previews.forEach((url) => URL.revokeObjectURL(url));
      setPreviews([]);
      setIsExpanded(false); // Collapse after submit
    },
    onError: () => {
      alert("Failed to create post. Please try again.");
    },
  });

  function handleFileChange(e) {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleSubmit(e) {
  e.preventDefault();
  if (!title.trim()) {
    alert("Please enter a title.");
    return;
  }
  if (!markdown.trim() && !linkUrl.trim()) {
    alert("Please enter content or a link.");
    return;
  }
  if (!session?.user?.id) {
    alert("You must be logged in to create a post.");
    return;
  }

  const tags = extractHashtags(markdown);

  const formData = new FormData();
  formData.append("title", title);
  formData.append("markdown", markdown);
  formData.append("user_id", session.user.id);
  if (linkUrl.trim()) formData.append("link_url", linkUrl.trim());

  // Append tags as JSON string
  formData.append("tags", JSON.stringify(tags));

  files.forEach((file) => formData.append("files", file));

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
          Create Post...
        </div>
      ) : (
        <motion.form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md flex flex-col gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition dark:bg-gray-800 dark:text-white"
            disabled={mutation.isLoading}
            required
          />
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Write something..."
            rows={4}
            className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 transition dark:bg-gray-800 dark:text-white"
            disabled={mutation.isLoading}
          />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Add a link"
            className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition dark:bg-gray-800 dark:text-white"
            disabled={mutation.isLoading}
          />
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*,application/pdf"
            onChange={handleFileChange}
            className="mb-2"
            disabled={mutation.isLoading}
          />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative w-24 h-20 border rounded overflow-hidden shadow"
                >
                  {file.type.startsWith("image/") && (
                    <img
                      src={previews[index]}
                      alt={`preview-${index}`}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(previews[index])}
                    />
                  )}
                  {/* Add video/audio previews if desired */}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700 transition"
                    aria-label="Remove file"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={!isUserLoggedIn || mutation.isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded transition disabled:opacity-50"
            >
              {mutation.isLoading ? "Posting..." : "Post"}
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
