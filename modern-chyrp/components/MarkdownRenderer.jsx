"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";
import { Fragment } from "react";

function renderTextWithHashtags(text) {
  const parts = text.split(/(#\w+)/g);
  return parts.map((part, i) => {
    if (part.match(/^#\w+$/)) {
      const tag = part.slice(1);
      return (
        <a
          key={i}
          href={`/tags/${tag}`}
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {part}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function MarkdownRenderer({ source = "" }) {
  if (typeof source !== "string" || !source.trim()) {
    return <p className="text-gray-400 italic">No content available.</p>;
  }

  return (
    <div className="prose prose-indigo dark:prose-invert max-w-none break-words whitespace-pre-line">
      <ReactMarkdown
        children={source}
        remarkPlugins={[remarkGfm]}  // Removed remarkMath
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-semibold mt-4 mb-3" {...props} />
          ),

          p: ({ node, children, ...props }) => {
            const containsBlock =
              node.children &&
              node.children.some((child) =>
                ["code", "html", "table", "blockquote"].includes(child.type)
              );
            if (containsBlock) {
              return <>{children}</>;
            }
            const safeChildren = Array.isArray(children) ? children : [children];
            return (
              <p {...props}>
                {safeChildren.map((child, i) =>
                  typeof child === "string" ? renderTextWithHashtags(child) : child
                )}
              </p>
            );
          },

          code({ node, inline, className, children, ...props }) {
            return inline ? (
              <code
                className="bg-gray-200 dark:bg-gray-800 rounded px-1 text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre
                className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto"
                {...props}
              >
                <code className={`${className ?? ""} font-mono text-sm`}>
                  {children}
                </code>
              </pre>
            );
          },

          a: ({ node, ...props }) => (
            <a
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-indigo-400 pl-4 italic text-gray-600 dark:text-gray-300"
              {...props}
            />
          ),

          img: ({ node, ...props }) => (
            <img
              className="rounded-lg shadow-md max-w-full h-auto mx-auto my-4"
              alt={props.alt || "Image"}
              {...props}
            />
          ),
        }}
      />
    </div>
  );
}
