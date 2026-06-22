const express = require("express");
const router = express.Router();

router.get("/", function (req, res) {
  res.render("index", { title: "Library Management API" });
});

module.exports = router;
