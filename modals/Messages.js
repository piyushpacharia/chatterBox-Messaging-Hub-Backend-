const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    sender: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    receiver: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    messageId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("chatterboxMessages", messageSchema);
