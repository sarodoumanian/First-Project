var express = require("express");
var router = express.Router();
const User = require("../models/User");
const Post = require("../models/Post");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const validator = require("validator");
var ObjectId = require("mongoose").Types.ObjectId;

const multerConfig = {
  storage: multer.diskStorage({
    //Setup where the user's file will go
    destination: function (req, file, next) {
      next(null, "./public/images");
    },

    //Then give the file a unique name
    filename: function (req, file, next) {
      console.log(file);
      const ext = file.mimetype.split("/")[1];
      next(null, file.fieldname + "-" + Date.now() + "." + ext);
    },
  }),

  //A means of ensuring only images are uploaded.
  fileFilter: function (req, file, next) {
    if (!file) {
      next();
    }
    const image = file.mimetype.startsWith("image/");
    if (image) {
      console.log("photo uploaded");
      next(null, true);
    } else {
      console.log("file not supported");

      //TODO:  A better message response to user on failure.
      return next();
    }
  },
};

/* GET users listing. */
router.post("/signup", async (req, res) => {
  if (req.body.username === "") {
    req.flash("error", "Please provide a username");
    return res.redirect("/signup");
  }

  if (req.body.password < 4) {
    req.flash("error", "Password should be at least 4 characters");
    return res.redirect("/signup");
  }

  if (!validator.isEmail(req.body.email)) {
    req.flash("error", "Please provide a proper email");
    return res.redirect("/signup");
  }
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user) {
      req.flash("error", "This username is already registered");
      return res.redirect("/signup");
    } else {
      const hashedpassword = await bcrypt.hash(req.body.password, 8);
      const newuser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hashedpassword,
        age: req.body.age,
      });
      req.flash("error", "User registered successfully");
      await newuser.save();
      res.redirect("/signin");
    }
  } catch (error) {
    //console.log(error);
    res.redirect("/signup");
  }
});

router.post(
  "/signin",
  passport.authenticate("local", {
    failureRedirect: "/signin",
    //failureFlash: true,
    //failureRedirect: "/signin",
    // successRedirect: "/"
  }),
  (req, res) => {
    // If this function gets called, authentication was successful.

    req.session.user = req.user;
    res.redirect("/profile/" + req.user._id);
  }
);

router.put("/update/:id", async (req, res) => {
  let user;
  try {
    user = await User.findById(req.params.id);
    if (req.body.password) {
      const hashedpassword = await bcrypt.hash(req.body.password, 8);
      user.password = hashedpassword;
    }
    user.username = req.body.username;
    user.email = req.body.email;
    user.age = req.body.age;
    user.save();
    req.session.user = user;
    res.redirect("/profile/" + user._id);
  } catch (error) {
    console.log(error);
    if (user == null) {
      res.redirect("/home");
    } else {
      res.redirect("/update/" + user._id);
    }
  }
});

router.post(
  "/upload",
  multer(multerConfig).single("photo"),
  async function (req, res) {
    try {
      let user = await User.findById(req.user._id);
      user.hasProfilePic = true;
      user.img.data = fs.readFileSync(req.file.path);
      user.img.contentType = "image/png";
      user.save();
      res.redirect("/profile/" + user._id);
    } catch (error) {
      console.log(error);
    }
  }
);

router.post("/postStory/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (req.body.postStory === "") {
    console.log(req.user._id);
    return res.redirect("/profile/" + user._id);
  }

  try {
    const post = new Post({
      description: req.body.postStory,
      username: user._id,
    });
    user.stories.push(post);
    await post.save();
    await user.save();

    res.redirect("/profile/" + user._id);
  } catch (err) {
    console.log(err);
    res.redirect("/profile/" + user._id);
  }
});

router.delete("/DeleteUser/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    const ismatch = await bcrypt.compare(req.body.delUserPass, user.password);
    if (ismatch) {
      if (user.stories.length > 0) {
        await Post.deleteMany({ username: user._id });
      }
      await User.findByIdAndRemove({ _id: req.params.id });
      res.redirect("/users");
    } else {
      req.flash("error", "Wrong Password");
      res.redirect("/deleteUser");
    }
  } catch (error) {
    console.log(error);
  }
});

router.delete("/Deletepost/:id", async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id });
    User.findOneAndUpdate(
      { _id: req.user._id },
      { $pull: { stories: req.params.id } },
      { returnOriginal: false },
      (err, user) => {
        if (err) {
          console.log(error);
        }
        res.redirect("/profile/" + req.user._id);
      }
    ).exec();
    console.log(user);
    await Post.deleteOne({ _id: req.params.id });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
