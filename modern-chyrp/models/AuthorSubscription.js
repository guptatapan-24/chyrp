import mongoose from "mongoose";

const AuthorSubscriptionSchema = new mongoose.Schema({
  subscriber_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.models.AuthorSubscription || mongoose.model("AuthorSubscription", AuthorSubscriptionSchema);
