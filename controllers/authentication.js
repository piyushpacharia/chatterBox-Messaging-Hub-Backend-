const bcrypt = require("bcrypt");
const User = require("../modals/ChatUser");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
//step 1 (Login)
const login = (req, res) => {
  const { email, password } = req.body;

  //if user not exists
  User.findOne({ email: email })
    .then((user) => {
      if (!user)
        return res
          .status(401)
          .json({ success: false, message: "Email Not Found" });

      //when user did't verify email
      if (user.verified == false)
        return res
          .status(401)
          .json({ success: false, message: "Please Verify Your Email" });
      // compare user input password to actual
      bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
          const token = jwt.sign(
            {
              _id: user._id,
              name: user.name,
            },
            process.env.HASH_PASS
          );
          return res.status(200).json({
            success: true,
            message: "LoggedIn Successfully",
            token: token,
            name: user.name,
            _id: user._id,
            profilePic: user.profilePic,
            About: user.About,
          });
        } else {
          return res
            .status(401)
            .json({ success: false, message: "Incorrect Password" });
        }
      });
    })
    .catch((err) => {
      return res.status(500).json({
        success: false,
        message: "Something Went Wrong" + err.message,
      });
    });
};

const signup = async (req, res) => {
  const { email, password, name } = req.body;

  if (!name || !email || !password)
    return res.status(401).json({ success: false, message: "Invalid Data" });

  try {
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      if (existingUser.verified === false) {
        // If the user exists but is not verified, resend the activation email
        const token = jwt.sign({ _id: existingUser._id }, process.env.HASH_PASS);

        let mailTransporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.USER,
            pass: process.env.PASS,
          },
        });

        let mailDetails = {
          to: existingUser.email,
          from: process.env.USER,
          subject: "Activate Your ChatterBox Messaging Hub Account !",
          html: `
            <h1> Welcome to the ChatterBox Messaging Hub ! </h1>
            <p> We are happy to onboard you </p>
            <a href="${process.env.BACKEND_URL}/auth/activate-account/${token}"> Click here to verify your email </a>
          `,
        };

        await mailTransporter.sendMail(mailDetails);

        return res.status(200).json({
          success: true,
          message: "Account activation link has been resent to your email",
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Email Is Already Exists and Verified!",
        });
      }
    } else {
      // User does not exist, create a new user
      const hashPassword = bcrypt.hashSync(password, 10);
      const newUser = await User.create({
        name,
        email,
        password: hashPassword,
      });

      // Sending activation email for the new user
      const token = jwt.sign({ _id: newUser._id }, process.env.HASH_PASS);

      let mailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.USER,
          pass: process.env.PASS,
        },
      });

      let mailDetails = {
        from: process.env.USER,
        to: newUser.email,
        subject: "Activate Your ChatterBox Messaging Hub Account !",
        html: `
          <h1> Welcome to the ChatterBox Messaging Hub  ! </h1>
          <p> We are happy to onboard you </p>
          <a href="process.env.BACKEND_URL/auth/activate-account/${token}"> Click here to verify your email </a>
        `,
      };

      await mailTransporter.sendMail(mailDetails);

      return res.status(200).json({
        success: true,
        message: "Account activation link has been sent to your email",
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something Went Wrong: " + err.message,
    });
  }
};


const activateAccount = async (req, res) => {
  const token = req.params.token;
  try {
    const data = jwt.verify(token, process.env.HASH_PASS);

    await User.findByIdAndUpdate(data._id, {
      verified: true,
    });
    
    res.redirect("https://chatter-box-messaging-hub.vercel.app/")
  } catch (err) {
    res.json({ success: false, message: "Link Expired" });
  }
};

const sendForgetPasswordLink = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(401).json({ success: false, message: "Invalid Data" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "No Account found with this email!",
      });
    }

    // Generate forget password token
    let token = jwt.sign({ _id: user._id }, process.env.FORGET_PASS);

    // Modify the token so that it will work on vite
    let newToken1 = token.replace(".", "--");
    let newToken2 = newToken1.replace(".", "--");

    // Create a mail transporter
    let mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });
    var mailDetails = {
      from: process.env.USER,
      to: user.email,
      subject: "Forget Password",
      html: `
        <h3>ChatterBox Messaging Hub</h3>
          <p> Hey ${user.name}, Click on the following link to update your password </p>
        
          <a style="padding:10px; background-color: dodgerblue" href="${process.env.FRONTEND_URL}/forget-password/set-password/${newToken2}"> Update Password </a>
  
          <p> If it's not done by you, just ignore it </p>
          `,
    };
    await mailTransporter.sendMail(mailDetails);
    return res.json({
      success: true,
      message: "A Forget Password Link sent to your email",
    });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

const handlePasswordUpdateDetails = async (req, res) => {
  const { token, password } = req.body;
  let newToken1 = token.replace("--", ".");
  let newToken2 = newToken1.replace("--", ".");

  try {
    const data = jwt.verify(newToken2, process.env.FORGET_PASS);

    const hash = bcrypt.hashSync(password, 10);

    await User.findOneAndUpdate({ _id: data._id }, { password: hash });
    return res.json({ success: true, message: "Password Updated" });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

const uploadProfilePic = async (req, res) => {
  if (req.file) {
    await User.findByIdAndUpdate(req.user._id, {
      profilePic: req.file.location,
    });

    return res.json({
      success: true,
      message: "File Uploaded",
      profilePic: req.file.location,
    });
  }

  return res.json({
    success: false,
    message: "Failed To Upload ProfilePic",
    profilePic: req.file.location,
  });
};

const updateUserAbout = (req, res) => {
  const { aboutInfo } = req.body;
  const token = req.headers.authorization;
  try {
    const data = jwt.verify(token, process.env.HASH_PASS);
    User.findOneAndUpdate({ _id: data._id }, { About: aboutInfo })
      .then(() => {
        return res
          .status(200)
          .json({ success: true, message: "About Info Updated" });
      })
      .catch((err) => {
        return res.status(401).json({
          success: true,
          message: "Something Went Wrong" + err.message,
        });
      });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Invalid Token " + err.message });
  }
};
const fetchUserAboutInfo = (req, res) => {
  const token = req.headers.authorization;
  try {
    const data = jwt.verify(token, process.env.HASH_PASS);
    User.findOne({ _id: data._id })
      .then((user) => {
        return res.status(200).json({ success: true, message: user.About });
      })
      .catch((err) => {
        return res.status(401).json({ success: false, message: err.message });
      });
  } catch {
    return res
      .status(500)
      .jso({ success: false, message: "Something Went Wrong" + err.message });
  }
};
module.exports = {
  login,
  signup,
  activateAccount,
  sendForgetPasswordLink,
  handlePasswordUpdateDetails,
  uploadProfilePic,
  updateUserAbout,
  fetchUserAboutInfo,
};
