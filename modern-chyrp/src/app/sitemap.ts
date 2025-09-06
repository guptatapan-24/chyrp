// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { getPosts } from "@/lib/posts";

interface Post {
  slug: string;
  updatedAt: string;
  // add more fields if needed
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "http://localhost:3000"; // Your frontend URL

  const posts: Post[] = await getPosts();

  // Map posts to sitemap entries safely
  const postUrls = posts.map((post: Post) => ({
    url: `${baseUrl}/posts/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...postUrls,
  ];
}
