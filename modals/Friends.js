const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Types.ObjectId,
    ref: "chatterboxusers",
    required: true,
  },
  receiver: {
    type: mongoose.Types.ObjectId,
    ref: "chatterboxusers",
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending",
    required: true,
  },
  connectionId: {
    type: String,
  },
});
module.exports = mongoose.model("chatterboxFriends", friendSchema);
