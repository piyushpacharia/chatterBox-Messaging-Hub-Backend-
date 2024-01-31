const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/general");
const {
  createGroup,
  fetchAllGroups,
  addMembers,
  fetchGroupMembers,
  removeMember,
  deleteGroup,
} = require("../controllers/group");

router.post("/create-group", isLoggedIn, createGroup);
router.get("/all-groups", isLoggedIn, fetchAllGroups);
router.put("/add-members/:groupId", isLoggedIn, addMembers);
router.get("/group-members/:groupId", isLoggedIn, fetchGroupMembers);
router.put("/remove-member/:groupId", isLoggedIn, removeMember);
router.delete("/delete-group/:groupId", isLoggedIn, deleteGroup);

module.exports = router;
