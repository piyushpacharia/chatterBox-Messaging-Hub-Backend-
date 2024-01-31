const mongoose = require("mongoose");

const groupChatSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Types.ObjectId,
    ref: "chatterboxusers",
    required: true,
  },
  groupName: {
    type: String,
    required: true,
  },
  groupMembers: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "chatterboxusers",
    },
  ],
  groupImage: {
    type: String,
    required: true,
    default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  },
});

module.exports = mongoose.model("GroupChat", groupChatSchema);
