const mongoose = require('mongoose');

// Define the schema for the "neha" collection
const nehaSchema = new mongoose.Schema({
  name: String,
  age: Number,
  // Add other fields as needed
});

// Create the Mongoose model for the "neha" collection
const Neha = mongoose.model('Neha', nehaSchema);

module.exports = Neha;
