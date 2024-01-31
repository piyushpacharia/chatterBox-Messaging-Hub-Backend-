const User = require("../modals/ChatUser");
const Friends = require("../modals/Friends");
const Groups = require("../modals/Group");
const dotenv = require("dotenv");
dotenv.config();
const { getSocket } = require("../socket");
//search friends
const searchFriend = (req, res) => {
  const { query } = req.body;
  User.find({ $text: { $search: query } })
    .then((users) => {
      res.status(200).json({ success: true, users });
    })
    .catch((err) => {
      return res.status(500).json({ success: false, message: err.message });
    });
};

//add friend
const addFriend = async (req, res) => {
  const { friendid } = req.params;

  //check if user with this id is present or not
  try {
    const friend = await User.findById(friendid);

    if (req.user._id == friendid) {
      return res.status(400).json({
        success: false,
        message: "You Cannot Sent Friend Request To Yourself",
      });
    }
    if (!friend) {
      return res
        .status(401)
        .json({ success: false, message: "No user found by this id" });
    }

    //generating the unique id by combining both user id
    let connectionId;
    if (req.user._id > friendid) connectionId = req.user._id + friendid;
    else connectionId = friendid + req.user._id;
    //check if already in friends
    const alreadyInConnection = await Friends.findOne({
      connectionId: connectionId,
      $or: [{ status: "Pending" }, { status: "Accepted" }],
    });
    if (alreadyInConnection)
      return res
        .status(400)
        .json({ success: false, message: "Already in Friends" });

    //adding the user by generating unique key

    
    const newFriend = await Friends.create({
      sender: req.user._id,
      receiver: friendid,
      connectionId: connectionId,
    })
    await newFriend.populate("sender" , "name email profilePic");
    
    // await Friends.findById(newFriend._id)
    
   const io = getSocket();
    io.to(friendid).emit("pending-request", newFriend)
    return res
      .status(200)
      .json({ success: true, message: "Friend Request Sent" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// connected or pending friends

const giveConnectedFriends = async (req, res) => {
  try {
    const friends = await Friends.find({
      status: "Accepted",
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    }).populate("sender receiver");
    return res.status(200).json({ success: true, friends });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const fetchPendingRequest = async (req, res) => {
  try {
    const friends = await Friends.find({
      status: "Pending",
      receiver: req.user._id,
    }).populate("sender");
    
    return res.status(200).json({ success: true, friends });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

//accept or reject friend request

const acceptFriendRequest = async (req, res) => {
  try {
    const { docid } = req.params;

    const result = await Friends.findOneAndUpdate(
      { _id: docid, receiver: req.user._id },
      { status: "Accepted" }
    ).populate("sender receiver")
    if (!result) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Request" });
    }
    
    const io = getSocket();
    io.to(result.sender._id.toString()).emit("accept-friend-request", result);
    return res.status(200).json({ success: true, message: "Request Accepted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
const unfriend = async (req, res) => {
  const connectionId= req.params.connectionId;
  try {
    // Find the friend connection
    const friendConnection = await Friends.findOne({
      connectionId,
      status: "Accepted",
    });

    if (!friendConnection) {
      return res.status(400).json({
        success: false,
        message: "Friend connection not found or not accepted",
      });
    }

    // Delete the friend connection
     const result = await Friends.findByIdAndDelete(friendConnection._id);

    const io = getSocket();
    io.to(connectionId).emit("unfriend-friend", result)

    return res
      .status(200)
      .json({ success: true, message: "Unfriend successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
const rejectFriendRequest = async (req, res) => {
  const { docid } = req.params;

  const result = await Friends.findOneAndUpdate(
    { _id: docid, receiver: req.user._id },
    { status: "Rejected" }
  );
  if (!result) {
    return res.status(400).json({ success: false, message: "Invalid Request" });
  }
  return res.status(200).json({ success: true, message: "Request Rejected" });
};
const searchFriendAndGroup = async (req, res) => {
  const { query } = req.body;

  try {
    const friends = await Friends.find({
      $or: [
        { sender: req.user._id, status: "Accepted" },
        { receiver: req.user._id, status: "Accepted" },
      ],
    })
      .populate("sender", "name profilePic")
      .populate("receiver", "name profilePic");

    const groups = await Groups.find({
      $or: [{ groupMembers: req.user._id }],
    }).populate("groupName", "groupName ");

    const filteredFriends = friends.filter(
      (friend) =>
        friend.sender.name.includes(query.toLowerCase()) ||
        friend.receiver.name.includes(query.toLowerCase())
    );
    const filteredGroups = groups.filter((groups) =>
      groups.groupName.includes(query.toLowerCase())
    );

    res
      .status(200)
      .json({ success: true, users: filteredFriends, groups: filteredGroups });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  searchFriend,
  addFriend,
  giveConnectedFriends,
  fetchPendingRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend,
  searchFriendAndGroup,
};
