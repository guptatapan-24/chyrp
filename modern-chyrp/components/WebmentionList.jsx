"use client";
import React, { useEffect, useState } from "react";

export default function WebmentionList({ postId }) {
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMentions() {
      try {
        const res = await fetch(`/posts/${postId}/webmentions`);
        if (!res.ok) throw new Error("Failed to fetch mentions");
        const data = await res.json();
        setMentions(data);
      } catch {
        setMentions([]);
      } finally {
        setLoading(false);
      }
    }
    if (postId) fetchMentions();
  }, [postId]);

  if (loading) return <p>Loading mentions...</p>;
  if (mentions.length === 0) return <p>No webmentions yet.</p>;

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold mb-3">Webmentions</h3>
      <ul className="space-y-4">
        {mentions.map((mention) => (
          <li key={mention.id} className="border rounded p-3 space-y-1">
            {mention.author_name && (
              <p className="font-medium">{mention.author_name}</p>
            )}
            {mention.content && <p className="italic">{mention.content}</p>}
            <a
              href={mention.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              View Original
            </a>
            <p className="text-xs text-gray-500">
              Received: {new Date(mention.received_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
