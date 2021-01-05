const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Post = require("./Post");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  img: {
    data: Buffer,
    contentType: String,
  },
  hasProfilePic: {
    type: Boolean,
    default: false,
  },
  stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
});

module.exports = mongoose.model("user", userSchema);
