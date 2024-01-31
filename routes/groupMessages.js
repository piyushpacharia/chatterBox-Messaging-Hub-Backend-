const express = require("express");
const router = express.Router();
const {
  sendMessage,
  fetchGroupMessages,
  deleteGroupMessage,
} = require("../controllers/groupMessages");
const { isLoggedIn } = require("../middleware/general");

router.post("/send-message/:groupId", isLoggedIn, sendMessage);
router.get("/fetch-message/:groupId", isLoggedIn, fetchGroupMessages);
router.delete(
  "/delete-group-message/:groupId/:messageId",
  isLoggedIn,
  deleteGroupMessage
);

module.exports = router;
