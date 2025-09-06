import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, // assuming user ids are ObjectIds, else String
    required: true,
    ref: "User",
  },
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  markdown: {
    type: String,
    default: "",
  },
  likes: {
    type: Number,
    default: 0,
  },
  type: {
    type: String,
    default: null,
    enum: ["quote", "post", null],
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  tags: {
    type: [String],
    default: [],
  },
  views: {
    type: Number,
    default: 0,
  },
  link_url: {
    type: String,
    default: null,
  },
});

export default mongoose.models.Post || mongoose.model("Post", PostSchema);