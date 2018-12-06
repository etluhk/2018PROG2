var express = require('express');
var router = express.Router();

var Map = require('../models/datasets');

/* GET home page. */
router.get('/', function(req, res, next) {

  console.log(req.query);

  switch(req.query.method) {
    case "getAllMarkers":
      Map.find({}, function(err, markers) {
        //if (err) console.log(err);
  
        console.log(markers);
        res.json(markers);
     });
     break;
    case "delMarker":
      console.log("Marker "+req.query.id+"will be deleted soon!");
      Map.findOneAndDelete({'_id': req.query.id}, function(err, deleted) {
        //if (err) console.log(err);

        console.log(deleted);
        res.json({status: "Done"});
        });
        break;
      default:
        res.json("OKI");
  }
});

router.post('/', function(req, res, next) {
  console.log(req.body);

  console.log("Marker will be added soon!");
  var marker = new Map(req.body);

  marker.save(function(err) {
    if (err) console.log(err);
    res.json(marker);
  });
});

module.exports = router;