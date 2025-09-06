import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }, // optional timestamp
});

export default mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
