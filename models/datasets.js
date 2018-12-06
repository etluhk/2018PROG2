// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a map marker schema
var mapMarkerSchema = new Schema({
  name: String,
  position: {
    lat: Number,
    lng: Number
  },
  icon: String,
  content: String
});

// create models for schemas
var Map = mongoose.model('Map', mapMarkerSchema);

// make this available in our Node applications
module.exports = Map;