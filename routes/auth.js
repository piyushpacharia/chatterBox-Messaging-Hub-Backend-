const express = require("express");
const router = express.Router();

const {
  login,
  signup,
  activateAccount,
  sendForgetPasswordLink,
  handlePasswordUpdateDetails,
  uploadProfilePic,
  updateUserAbout,
  fetchUserAboutInfo,
} = require("../controllers/authentication");
const { upload } = require("../middleware/multer");
const { isLoggedIn } = require("../middleware/general");
router.post("/login", login);
router.post("/signup", signup);
router.get("/activate-account/:token", activateAccount);
router.post("/forget-password", sendForgetPasswordLink);
router.post("/handle-update-password", handlePasswordUpdateDetails);

router.post(
  "/upload/profile-pic",
  isLoggedIn,
  upload.single("profilepic"),
  uploadProfilePic
);

router.put("/update-user-about", isLoggedIn, updateUserAbout);
router.get("/get-user-about", isLoggedIn, fetchUserAboutInfo);

module.exports = router;
