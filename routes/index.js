var express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
var router = express.Router();
const { ensureAuth, forwardAuth } = require("../passport/auth");

/* GET home page. */
router.get("/signup", forwardAuth, async function (req, res) {
  const messages = await req.consumeFlash("error");

  console.log(messages);
  res.render("signup", { messages });
});

router.get("/signin", forwardAuth, async function (req, res) {
  const messages = await req.consumeFlash("error");
  res.render("signin", { messages });
});

router.get("/deleteUser", async (req, res) => {
  const messages = await req.consumeFlash("error");
  res.render("deleteUser", { messages });
});

router.get("/update/:id", ensureAuth, async function (req, res) {
  try {
    const user = await User.findById(req.params.id);
    res.render("update", { user });
  } catch (error) {
    console.log(error);
  }
});

router.get("/", async (req, res) => {
  // try {
  //   const posts = await Post.find()
  //   console.log(posts);
  //   res.render("home", {posts})
  // } catch (error) {
  //   console.log(error);
  // }

  try {
    Post.find()
      .sort({ _id: -1 })
      .populate("username")
      .exec(function (err, posts) {
        if (err) console.log(err);
        res.render("home", { posts });
      });
  } catch (error) {}
});

router.get("/profile/:userId/picture", function (req, res, next) {
  User.findById(req.params.userId, function (err, user) {
    if (err) return next(err);
    //res.contentType(user.img.contentType);
    res.send(user.img.data);
  });
});

// router.get('/users',  async(req, res)=> {
//   try {
//     const users = await User.find().sort({_id: -1})
//     res.render("users", {
//       users
//     })
//   } catch (err) {
//     console.log(err);
//   }
// });

router.get("/updateProfilePic", (req, res) => {
  res.render("updateProfilePic");
});

router.get("/users", function (req, res) {
  var noMatch = null;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    // Get all campgrounds from DB
    User.find({ username: regex }, function (err, users) {
      if (err) {
        console.log(err);
      } else {
        if (users.length < 1) {
          noMatch = "No user match that query, please try again.";
        }
        res.render("users", { users, noMatch });
      }
    });
  } else {
    // Get all campgrounds from DB
    User.find({}, function (err, users) {
      if (err) {
        console.log(err);
      } else {
        res.render("users", { users, noMatch });
      }
    });
  }
});

router.get("/profile/:id", async function (req, res) {
  try {
    const user = await User.findById(req.params.id);
    Post.find({ username: user._id })
      .sort({ _id: -1 })
      .populate("User")
      .exec(function (err, story) {
        if (err) return handleError(err);
        res.render("new", { user, story });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/logout", (req, res) => {
  req.logout();
  req.session.user = {};
  res.redirect("/");
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;
