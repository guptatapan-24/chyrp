// src/lib/posts.ts
export async function getPosts() {
  const baseUrl = "http://localhost:8000"; // Your backend base URL

  const res = await fetch(`${baseUrl}/posts`, { cache: "no-store" });
  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  const posts = data.posts; // Access posts array inside response

  // Map posts to expected fields for sitemap
  return posts.map((post: any) => ({
    id: post.id,
    slug: post.slug || String(post.id),
    updatedAt: post.updatedAt || new Date().toISOString(),
  }));
}
