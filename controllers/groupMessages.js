const GroupMessages = require("../modals/GroupMessages");
const GroupUsers = require("../modals/Group");
const { getSocket } = require("../socket");

const sendMessage = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const message = req.body.message;

    const isMember = await GroupUsers.findOne({
      _id: groupId,
      groupMembers: req.user._id,
    });
    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this group",
      });
    }
    const newMessage = await GroupMessages.create({
      sender: req.user._id,
      message: message,
      receiver: groupId,
    });

    if (!newMessage) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong while sending the message",
      });
    }

    let io = getSocket();
    io.to(groupId).emit("new-group-message", newMessage);

    return res.status(200).json({ success: true, message: "Message Sent" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error " + err.message,
    });
  }
};

const fetchGroupMessages = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const isMember = await GroupUsers.findOne({
      _id: groupId,
      groupMembers: req.user._id,
    });
    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this group",
      });
    }
    const getMessages = await GroupMessages.find({
      receiver: groupId,
    })
      .populate("sender", "name profilePic")
      .exec();

    return res.status(200).json({ success: true, message: getMessages });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error " + err.message,
    });
  }
};

const deleteGroupMessage = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const messageId = req.params.messageId;

    // Check if the user has the authority to delete the message
    const isMember = await GroupUsers.findOne({
      _id: groupId,
      groupMembers: req.user._id,
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete messages in this group",
      });
    }

    // Delete the group message
    const deletedMessage = await GroupMessages.findByIdAndDelete(messageId);

    if (!deletedMessage) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Message deleted successfully" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error " + err.message,
    });
  }
};

module.exports = { sendMessage, fetchGroupMessages, deleteGroupMessage };
