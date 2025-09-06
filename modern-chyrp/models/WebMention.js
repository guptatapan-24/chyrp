import mongoose from "mongoose";

const WebmentionSchema = new mongoose.Schema({
  source_url: { type: String, required: true },
  target_url: { type: String, required: true },
  author_name: { type: String, default: null },
  author_url: { type: String, default: null },
  content: { type: String, default: null },
  published_at: { type: Date },
  received_at: { type: Date, default: Date.now },
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
});

export default mongoose.models.Webmention || mongoose.model("Webmention", WebmentionSchema);
