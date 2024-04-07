const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  userId:String,
  item: String,
  value: Number,
  image: String,
  highestBid: { type: Number, default: 0 },
  winningBidder: { type: String, default: '' },
  endTime: Date
});

const Auction = mongoose.model('Auction', auctionSchema);

module.exports = Auction;
