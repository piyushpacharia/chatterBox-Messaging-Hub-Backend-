const express = require("express");
const router = express.Router();

const {
  searchFriend,
  addFriend,
  giveConnectedFriends,
  fetchPendingRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend,
  searchFriendAndGroup,
} = require("../controllers/friends");

const { isLoggedIn } = require("../middleware/general");

router.post("/search-friend", isLoggedIn, searchFriend);

router.get("/add-friend/:friendid", isLoggedIn, addFriend);

router.get("/all-friends", isLoggedIn, giveConnectedFriends);

router.get("/all-pending", isLoggedIn, fetchPendingRequest);

router.get("/accept-request/:docid", isLoggedIn, acceptFriendRequest);

router.get("/reject-request/:docid", isLoggedIn, rejectFriendRequest);

router.delete("/unfriend/:connectionId", isLoggedIn, unfriend);

router.post("/friends-groups", isLoggedIn, searchFriendAndGroup);

module.exports = router;
