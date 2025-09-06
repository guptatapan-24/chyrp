import mongoose from "mongoose";

const PostLikeSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }, // optional timestamp
});

export default mongoose.models.PostLike || mongoose.model("PostLike", PostLikeSchema);
