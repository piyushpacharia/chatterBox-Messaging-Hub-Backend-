const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const isLoggedIn = (req, res, next) => {
  const token = req.headers.authorization;

  try {
    const data = jwt.verify(token, process.env.HASH_PASS);
    req.user = data;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }
};
module.exports = { isLoggedIn };
