const GroupChat = require("../modals/Group");
const Friends = require("../modals/Friends");
const GroupMessages = require("../modals/GroupMessages");
const createGroup = async (req, res) => {
  try {
    const createdBy = req.user._id;
    const { groupName, groupMembers, groupImage } = req.body;

    const areFriends = await Friends.find({
      $or: [
        {
          sender: createdBy,
          receiver: { $in: groupMembers },
          status: "Accepted",
        },
        {
          receiver: createdBy,
          sender: { $in: groupMembers },
          status: "Accepted",
        },
      ],
    });
    if (areFriends.length !== groupMembers.length) {
      return res.status(400).json({
        success: false,
        error: "Not all members are friends.",
      });
    }
    if (!groupMembers.includes(createdBy)) {
      groupMembers.push(createdBy);
    }
    const savedGroup = await GroupChat.create({
      createdBy,
      groupName,
      groupMembers,
      groupImage,
    });
    return res.status(200).json({ success: true, group: savedGroup });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error " + err.message,
    });
  }
};

const fetchAllGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const allGroups = await GroupChat.find({
      $or: [{ createdBy: userId }, { groupMembers: userId }],
    });
    res.status(200).json({ success: true, allGroups });
  } catch (err) {
    return res
      .status(500)
      .json({ success: true, message: "Internal Server Error " + err.message });
  }
};

const addMembers = async (req, res) => {
  try {
    const createdBy = req.user._id;
    const groupId = req.params.groupId;
    const newMembersId = req.body.groupMembers;

    const group = await GroupChat.findOne({
      _id: groupId,
      createdBy: createdBy,
    });
    if (!group) {
      return res.status(400).json({
        success: false,
        message: "Group not found Or you Don't have permission to add member",
      });
    }
    // check if new member is already a part of group
    if (group.groupMembers.includes(newMembersId)) {
      return res
        .status(400)
        .json({ success: false, message: "User is already exists in group" });
    }

    const areFriends = await Friends.findOne({
      $or: [
        { sender: createdBy, receiver: newMembersId, status: "Accepted" },
        { receiver: createdBy, sender: newMembersId, status: "Accepted" },
      ],
    });
    if (!areFriends) {
      return res.status(400).json({
        success: false,
        message: "You can only add your friends to the group",
      });
    }
    await GroupChat.updateOne(
      { _id: groupId },
      { $push: { groupMembers: newMembersId } }
    );
    res.status(200).json({
      success: true,
      message: "Member added to the group successfully.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const fetchGroupMembers = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user._id;

    await GroupChat.findOne({
      _id: groupId,
      groupMembers: { $in: userId },
    })
      .populate("groupMembers", "name _id email profilePic ")
      .then((allMembers) => {
        res.status(200).json({ success: true, allMembers });
      });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const memberId = req.body.memberId;
    const createdBy = req.user._id;

    const memberUpdate = await GroupChat.findOneAndUpdate(
      {
        createdBy,
        _id: groupId,
        groupMembers: memberId,
      },
      { $pull: { groupMembers: memberId } },
      { new: true }
    );
    if (!memberUpdate) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of the group or group not found.",
      });
    }
    res.status(200).json({
      success: true,
      message: "Member removed from the group successfully.",
      group: memberUpdate,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const createdBy = req.user._id;

    const removeGroup = await GroupChat.findOneAndDelete({
      _id: groupId,
      createdBy: createdBy,
    });
    await GroupMessages.deleteMany({
      receiver: groupId,
    });
    if (!removeGroup && !removeGroupMessages) {
      return res.status(404).json({
        success: false,
        message: "Group not found or you don't have permission to delete it.",
      });
    }
    res.status(200).json({ success: true, message: "Group Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const uploadGroupProfilePic = async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user._id;
  try {
    // Check if the user is a member of the group
    const group = await GroupChat.findOne({
      _id: groupId,
      groupMembers: userId
    });

    // If no group found or user not a member, return 404
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found or user not a member of the group."
      });
    }

    // Check if file was uploaded
    if (!req.file || !req.file.location) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or file location not provided."
      });
    }

    // Update the group profile picture
    group.groupImage = req.file.location;
    await group.save();

    // Return success response
    return res.status(200).json({
      success: true,
      message: "File Uploaded",
      profilePic: group.groupImage
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to upload ProfilePic"
    });
  }
};

module.exports = {
  createGroup,
  fetchAllGroups,
  addMembers,
  fetchGroupMembers,
  removeMember,
  deleteGroup,
  uploadGroupProfilePic
};
