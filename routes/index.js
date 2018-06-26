var express = require('express');
var router = express.Router();

/* GET home page. */
router.get(/\/.*/, function(req, res, next) {
  console.log("get /");
  res.render('index', { title: 'Related Key Map' });
});

module.exports = router;
