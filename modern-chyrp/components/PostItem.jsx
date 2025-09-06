"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import CommentList from "./CommentList";
import LikeButton from "./LikeButton";
import api from "../utils/api";
import { motion } from "framer-motion";
import ImageGridWithOverlay from "./ImageGridWithOverlay";
import WebmentionList from "./WebmentionList";

const MarkdownRendererNoSSR = dynamic(() => import("./MarkdownRenderer"), { ssr: false });

function getFileType(filename) {
  const ext = filename?.split(".").pop().toLowerCase();
  if (!ext) return null;
  if (["jpg", "jpeg", "png", "gif", "webp", "avif"].includes(ext)) return "image";
  if (["mp4", "webm", "ogg"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg"].includes(ext)) return "audio";
  return "other";
}

function estimateReadTime(text) {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export default function PostItem({ post }) {
  console.log('PostItem received post:', post);
  if (!post?.id) {
    console.warn('Post missing id:', post);
    return null; // Or display a fallback UI
  }
  const isQuote = post.type === "quote";
  const fileUrls = post.file_urls || [];
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const imageUrls = fileUrls
  .filter((url) => getFileType(url) === "image")
  .map(url =>
    url.startsWith('/')
      ? backendUrl + url       // No extra slash added
      : backendUrl + '/' + url // In case the URL doesn't start with /
  );
  const otherFiles = fileUrls.filter((url) => getFileType(url) !== "image");

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef(null);

  const { data: session } = useSession();

  // Read More state
  const [showFullContent, setShowFullContent] = useState(false);
  const previewLength = 300;
  const previewMarkdown =
    post.markdown && post.markdown.length > previewLength ? post.markdown.substring(0, previewLength) + "..." : post.markdown;

  // Local state to track views count (initialized from post.views)
  const [views, setViews] = useState(post.views ?? 0);

  // Increment views count on mount
  useEffect(() => {
    async function incrementViews() {
      try {
        const res = await api.post(`/posts/${post.id}/view`);
        if (res.status === 200) {
        setViews(res.data.views);
      }
      } catch (error) {
        console.error("Failed to increment views:", error);
      }
    }
    if (post.id) {
      incrementViews();
    }
  }, [post.id]);

  // Fetch author subscription status & bookmarks on mount
  useEffect(() => {
    if (post.author?.id && session?.user?.id) {
      api
        .get(`/authors/${post.author.id}/subscription`, {
          params: { user_id: session.user.id },
        })
        .then((res) => {
          setSubscribed(res.data.subscribed);
        });
    }
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    setBookmarked(bookmarks.includes(post.id));
  }, [post.author?.id, post.id, session?.user?.id]);

  // Reading progress bar handler on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const contentHeight = contentRef.current.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY || window.pageYOffset;
      const progress = Math.min(scrollTop / contentHeight, 1);
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // PATCHED: Send user_id as form data
  const toggleSubscription = async () => {
    if (!post.author?.id || !session?.user?.id) return;

    const formData = new FormData();
    formData.append("user_id", session.user.id);

    try {
      if (subscribed) {
        await api.post(`/authors/${post.author.id}/unsubscribe`, formData);
        setSubscribed(false);
      } else {
        await api.post(`/authors/${post.author.id}/subscribe`, formData);
        setSubscribed(true);
      }
    } catch (err) {
      console.error("Subscription toggle failed", err);
    }
  };

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    let updated;
    if (bookmarked) {
      updated = bookmarks.filter((id) => id !== post.id);
      setBookmarked(false);
    } else {
      updated = [...bookmarks, post.id];
      setBookmarked(true);
    }
    localStorage.setItem("bookmarks", JSON.stringify(updated));
  };

  const readTime = estimateReadTime(post.markdown || "");
  const postTime = new Date(post.updatedAt || post.createdAt || Date.now()).toLocaleString();

  return (
    <>
      {/* Reading progress bar */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 h-1 bg-indigo-600 dark:bg-indigo-400 z-50 transition-all"
        style={{ width: `${scrollProgress * 100}%` }}
      />
      <motion.div
        ref={contentRef}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6 hover:shadow-xl transition-shadow duration-300 max-w-3xl mx-auto"
        whileHover={{ y: -3, scale: 1.02 }}
      >
        {/* Title and meta */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h2 className="font-bold text-2xl text-gray-900 dark:text-gray-100">{post.title}</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
            <span>👁 {views} views</span>
            <span>⏱ {readTime} min read</span>
          </div>
        </div>

        {/* Posted by info */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Posted by <span className="font-semibold">{post.author?.name || "Unknown"}</span> at {postTime}
        </div>

        {/* Body Content with Link Feather check */}
        <>
          {post.link_url && (
            <a
              href={post.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-4 text-indigo-600 dark:text-indigo-400 underline break-all"
            >
              {post.link_url}
            </a>
          )}

          {post.id && <WebmentionList postId={post.id} />}

          {isQuote ? (
            <blockquote className="border-l-4 border-purple-600 italic pl-4 text-gray-700 dark:text-gray-300 mb-4">
              <MarkdownRendererNoSSR source={post.markdown} />
            </blockquote>
          ) : post.markdown ? (
            <div className="mb-4 break-all whitespace-pre-line">
              <MarkdownRendererNoSSR source={showFullContent ? post.markdown : previewMarkdown} />
              {post.markdown.length > previewLength && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                  aria-label={showFullContent ? "Show Less" : "Read More"}
                >
                  {showFullContent ? "Show Less" : "Read More"}
                </button>
              )}
            </div>
          ) : null}
        </>

        {/* Image grid with lightbox */}
        {imageUrls.length > 0 && <ImageGridWithOverlay imageUrls={imageUrls} />}

        {/* Other media files */}
        {otherFiles.map((fileUrl, idx) => {
          const fileType = getFileType(fileUrl);
          const src = `${backendUrl}/${fileUrl}`;
          if (fileType === "video") {
            return (
              <video key={idx} controls src={src} className="w-full max-h-[300px] rounded mb-4">
                Your browser does not support the video tag.
              </video>
            );
          }
          if (fileType === "audio") {
            return (
              <audio key={idx} controls src={src} className="w-full mb-4">
                Your browser does not support the audio element.
              </audio>
            );
          }
          return (
            <a
              key={idx}
              href={src}
              className="text-indigo-600 dark:text-indigo-400 underline mb-2 block"
              target="_blank"
              rel="noopener noreferrer"
            >
              Attached File
            </a>
          );
        })}

        {/* Author Info & Subscription / Bookmark */}
        {post.author && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 bg-gray-100 dark:bg-gray-700 p-4 rounded">
            <div className="flex items-center gap-4">
              <img
                src={
                  post.author.avatarUrl
                    ? post.author.avatarUrl
                    : `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(
                        post.author.name || post.author.id || "user"
                      )}&radius=50&backgroundType=gradientLinear`
                }
                alt={post.author.name}
                className="w-12 h-12 rounded-full object-cover border"
              />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{post.author.name}</p>
                {post.author.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs">{post.author.bio}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={toggleSubscription}
                className={`px-4 py-1.5 rounded text-sm font-medium ${
                  subscribed ? "bg-gray-500 hover:bg-gray-600" : "bg-green-600 hover:bg-green-700"
                } text-white transition`}
              >
                {subscribed ? "Unsubscribe" : "Subscribe"}
              </button>
              <button
                onClick={toggleBookmark}
                className={`px-4 py-1.5 rounded text-sm font-medium ${
                  bookmarked ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-300 hover:bg-gray-400"
                } text-gray-900 transition`}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark post"}
              >
                {bookmarked ? "Bookmarked" : "Bookmark"}
              </button>
            </div>
          </div>
        )}

        {/* Reactions & Comments with toggle */}
        <div className="flex items-center gap-6 mt-4">
          <LikeButton id={post.id} count={post.likes || 0} />
          <button
            onClick={() => setCommentsVisible((v) => !v)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold cursor-pointer transition"
            aria-expanded={commentsVisible}
            aria-controls={`comments-${post.id}`}
            type="button"
          >
            Comments
          </button>
        </div>

        {commentsVisible && (
          <div id={`comments-${post.id}`} className="mt-4 border-t border-gray-300 dark:border-gray-700 pt-4">
            <CommentList postId={post.id} />
          </div>
        )}
      </motion.div>
    </>
  );
}
