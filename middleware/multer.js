const multer = require("multer");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

//1. connect Aws Account
aws.config.update({
  secretAccessKey: process.env.AWS_ACCESS_SECRET,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  region: process.env.AWS_S3_REGION,
});

//2. initialize the s3 service from connect account

const mys3 = new aws.S3();

//3. create the middleware

const upload = multer({
  storage: multerS3({
    s3: mys3,
    acl: "public-read",
    bucket: "chatterbox-messaging-hub",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      console.log(file);
      cb(null, file.originalname);
    },
  }),
});



module.exports = { upload };
