interface Post {
  id: string;
  slug?: string;
  updatedAt?: string;
  // add other fields if needed
}

export async function getPosts() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";


  const res = await fetch(`${baseUrl}/posts`, { cache: "no-store" });
  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  const posts: Post[] = data.posts; // Access posts array inside response

  // Map posts to expected fields for sitemap
  return posts.map((post: Post) => ({
    id: post.id,
    slug: post.slug || String(post.id),
    updatedAt: post.updatedAt || new Date().toISOString(),
  }));
}
