const Messages = require("../modals/Messages");
const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.APP_ID,
  key: process.env.KEY,
  secret: process.env.SECRET,
  cluster: process.env.CLUSTER,
  useTLS: true,
});

// this function will send the message
const sendMessage = async (req, res) => {
  try {
    const { message, receiver } = req.body;
    let messageId;
    if (receiver > req.user._id) {
      messageId = receiver + req.user._id;
    } else {
      messageId = req.user._id + receiver;
    }

    //insert the message
    const newMessage = await Messages.create({
      message: message,
      sender: req.user._id,
      receiver: receiver,
      messageId: messageId,
    });
    //after inserting rhe message we will trigger the pusher channel
    pusher.trigger("chatterbox-channel", "message-added", newMessage);

    return res.status(200).json({ success: true, message: "Messege Sent" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// It will read all the messages
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
