// import packages
const express = require("express");
const router = express.Router();

// importing controllers
const {
  sendMessage,
  fetchAllMessages,
  deleteMessage,
} = require("../controllers/messages");

// importing middlewares
const { isLoggedIn } = require("../middleware/general");

router.post("/send-message", isLoggedIn, sendMessage);
router.get("/get-message/:receiver", isLoggedIn, fetchAllMessages);
router.delete("/delete-message/:messageId", isLoggedIn, deleteMessage);

module.exports = router;
