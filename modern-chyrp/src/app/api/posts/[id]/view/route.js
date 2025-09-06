import connectToDatabase from "../../../../../lib/mongodb";
import Post from "../../../../../../models/Post";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;

  await connectToDatabase();

  try {
    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } }, // atomic increment
      { new: true }
    );
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ views: post.views });
  } catch (error) {
    console.error("Failed to increment views:", error);
    res.status(500).json({ message: "Server error" });
  }
}
