const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());

app.use(cors());

//importing controllers
const authRoutes = require("./routes/auth");
const messagesRoutes = require("./routes/messages");
const friendsRoutes = require("./routes/friends");

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log("Something went Wrong", err.message));

// adding  server check route
app.get("/", (req, res) =>
  res.json({ success: true, message: "Server is Running Fine" })
);

app.use("/uploads", express.static("uploads"));

app.use("/auth", authRoutes);
app.use("/messages", messagesRoutes);
app.use("/friends", friendsRoutes);

const PORT = 8000;
app.listen(PORT, () => console.log(`server is running at : ${PORT}`));
