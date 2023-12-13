const User = require("../modals/ChatUser");
const Friends = require("../modals/Friends");
const dotenv = require("dotenv");
dotenv.config();
const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.APP_ID,
  key: process.env.KEY,
  secret: process.env.SECRET,
  cluster: process.env.CLUSTER,
  useTLS: true,
});

//search friends
const searchFriend = (req, res) => {
  const { query } = req.body;
  User.find({ $text: { $search: query } })
    .then((users) => {
      res.status(200).json({ success: true, users });
    })
    .catch((err) => {
      return res.status(500).json({ success: false, message: err, message });
    });
};

//add friend
const addFriend = async (req, res) => {
  const { friendid } = req.params;

  //check if user with this id is present or not
  try {
    const friend = await User.findById(friendid);

    if (req.user._id == friendid) {
      return res
        .status(400)
        .json({
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
    });

    const newFriendComplete = await Friends.findById(newFriend._id).populate(
      "sender"
    );

    pusher.trigger("chatterbox-channel", "friend-request", newFriendComplete);

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
    );
    if (!result) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Request" });
    }

    //fetch the again in order to populate and send the data
    const acceptedRequest = await Friends.findById(docid).populate(
      "sender receiver"
    );

    pusher.trigger(
      "chatterbox-channel",
      "friend-request-accepted",
      acceptedRequest
    );

    return res.status(200).json({ success: true, message: "Request Accepted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
const unfriend = async (req, res) => {
  try {
    // Find the friend connection
    const friendConnection = await Friends.findOne({
      connectionId: req.params.connectionId,
      status: "Accepted",
    });

    if (!friendConnection) {
      return res.status(400).json({
        success: false,
        message: "Friend connection not found or not accepted",
      });
    }

    // Delete the friend connection
    const unfriendFriend = await Friends.findByIdAndDelete(
      friendConnection._id
    );

    pusher.trigger("chatterbox-channel", "unfriend-request", {
      sender: req.user, // Assuming you have a user object in the request
      receiver: friendConnection.receiver, // Adjust this based on your data model
    });

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

module.exports = {
  searchFriend,
  addFriend,
  giveConnectedFriends,
  fetchPendingRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend,
};
