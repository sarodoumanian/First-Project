module.exports = {
  ensureAuth: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/signup");
    console.log("you are not signed in and cant access that page");
  },
  forwardAuth: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.status(400).redirect("/");
    console.log("you are signed in and cant access that page");
  },
};
