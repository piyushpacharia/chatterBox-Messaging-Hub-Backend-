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
  uploadGroupProfilePic,
} = require("../controllers/group");
const { upload } = require("../middleware/multer");

router.post("/create-group", isLoggedIn, createGroup);
router.get("/all-groups", isLoggedIn, fetchAllGroups);
router.put("/add-members/:groupId", isLoggedIn, addMembers);
router.get("/group-members/:groupId", isLoggedIn, fetchGroupMembers);
router.put("/remove-member/:groupId", isLoggedIn, removeMember);
router.delete("/delete-group/:groupId", isLoggedIn, deleteGroup);
router.post("/upload-group-profilePic/:groupId", isLoggedIn,upload.single("groupprofilepic"),
 uploadGroupProfilePic);

module.exports = router;
