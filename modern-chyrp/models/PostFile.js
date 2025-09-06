import mongoose from "mongoose";

const PostFileSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  file_url: { type: String, required: true },
});

export default mongoose.models.PostFile || mongoose.model("PostFile", PostFileSchema);
