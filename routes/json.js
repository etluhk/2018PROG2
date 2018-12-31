var express = require('express');
var router = express.Router();

var Map = require('../models/datasets');

router.get('/', function(req, res, next) {
  console.log(req.query);
});

router.post('/', function(req, res, next) {
  console.log(req.body);
});

module.exports = router;