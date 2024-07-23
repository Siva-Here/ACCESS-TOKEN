const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
  refreshToken: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now },
});

// const Token = mongoose.model('Token', tokenSchema);
const Token = mongoose.model('Token', tokenSchema);


module.exports = Token;
