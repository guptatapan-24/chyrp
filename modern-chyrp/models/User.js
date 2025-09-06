import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatarUrl: { type: String, default: null },
  bio: { type: String, default: null },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
