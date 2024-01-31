const Messages = require("../modals/Messages");

const { getSocket } = require("../socket");

const sendMessage = async (req, res) => {
  try {
    const { message, receiver } = req.body;
    let messageId;
    if (receiver > req.user._id) {
      messageId = receiver + req.user._id;
    } else {
      messageId = req.user._id + receiver;
    }

    const newMessage = await Messages.create({
      message: message,
      sender: req.user._id,
      receiver: receiver,
      messageId: messageId,
    });

    let io = getSocket();
    io.to(messageId).emit("new-message", newMessage);

    return res.status(200).json({
      success: true,
      messageId: newMessage.messageId,
      message: "Messege Sent",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const fetchAllMessages = async (req, res) => {
  try {
    const { receiver } = req.params;

    // generate message Id
    let messageId;
    if (receiver > req.user._id) {
      messageId = receiver + req.user._id;
    } else {
      messageId = req.user._id + receiver;
    }

    // fetch all the messages of this messageId
    const messages = await Messages.find({ messageId: messageId });

    return res.status(200).json({ success: true, messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user._id;

    const message = await Messages.findOne({
      _id: messageId,
      $or: [{ sender: userId }, { receiver: userId }],
    });
    if (!message) {
      return res
        .status(401)
        .json({ success: false, message: "Message Not Found" });
    }
    await Messages.deleteOne({ _id: messageId });
    return res.status(200).json({ success: true, message: "Message Deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { sendMessage, fetchAllMessages, deleteMessage };
