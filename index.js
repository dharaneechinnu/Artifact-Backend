require('dotenv').config()
const express = require('express')
const cors = require('cors');
const mongoose = require('mongoose');
const Auction = require('./Model/AddAuction'); 
const PORT = process.env.PORT|| 3510;
const MONGODB_URL = process.env.MONGO_URL
const app = express();
mongoose.connect(MONGODB_URL)
  .then(() => {
     console.log('Database is connected');
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err.message);
  });
  
app.use(cors())
app.use(express.json())

app.use('/Auth',require('./Route/AuthRouter'))


app.get('/api/auctions', async (req, res) => {
  try {
    const auctions = await Auction.find();
    res.status(200).json(auctions);
  } catch (error) {
    console.error('Error fetching auctions:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
});

/*GetIdonly */
app.get('/api/auctions/:id', async (req, res) => {
  const { id } = req.params;

  try {
  
    const auction = await Auction.findById(id);
    console.log("Backend : ",auction)
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
   const print =  res.status(200).json(auction);
   console.log(print)
  } catch (error) {
    console.error('Error fetching auction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*post item*/
app.post('/api/addAuction', async (req, res) => {
  const { userId,item, value, image } = req.body;

  try {
  
    const newAuction = new Auction({
      userId,
      item,
      value,
      image
    });

   
    const savedAuction = await newAuction.save();

    res.status(200).json(savedAuction);
  } catch (error) {
    console.error('Error creating auction:', error);
    res.status(500).json({ error: 'Failed to create auction' });
  }
});


/*getonlyby User */
app.get('/userAuctions', async (req, res) => {
  const userId = req.query.userId;

  try {
    console.log("Backend : ",userId)
    const userAuctions = await Auction.find({ userId: userId });

   const print = res.status(200).json(userAuctions);
   console.log(print)

  } catch (error) {
    console.error('Error fetching user auctions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/*Delete by user */
app.delete('/api/auctions/:id', async (req, res) => {
  const auctionId = req.params.id;

  try {
  
    const deletedAuction = await Auction.findByIdAndDelete(auctionId);
    if (!deletedAuction) {
      return res.status(404).json({ message: 'Auction item not found' });
    }
    res.status(200).json({ message: 'Auction item deleted successfully' });
  } catch (error) {
    console.error('Error deleting auction:', error);
    res.status(500).json({ message: 'Failed to delete auction item' });
  }
});

/*updataAuction */
app.post('/api/auctions/:id/bid', async (req, res) => {
  const auctionId = req.params.id;
  const { amount, userId } = req.body;
  console.log("Before : ",auctionId,amount,userId);
  try {
  
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

   
    if (isNaN(amount) || amount <= auction.highestBid) {
      return res.status(400).json({ message: 'Invalid bid amount' });
    }

   
    auction.highestBid = amount;
    auction.winningBidder = userId;
    await auction.save();

  
    res.status(200).json({
      highestBid: auction.highestBid,
      winningBidder: auction.winningBidder
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ message: 'Failed to place bid' });
  }
});


app.put('/api/joinAuction/:id', (req, res) => {
  const auctionId = parseInt(req.params.id);
  const { currentBid } = req.body;

  const auctionIndex = auctions.findIndex(auction => auction.id === auctionId);
  if (auctionIndex === -1) {
    res.status(404).json({ error: 'Auction not found' });
  } else {
    const auction = auctions[auctionIndex];
    if (currentBid <= auction.highestBid) {
      res.status(400).json({ error: 'Your bid must be higher than the current highest bid' });
    } else {
      auction.highestBid = currentBid;
      auction.bidHistory.push(currentBid);
      res.json(auction);
    }
  }
});

app.put('/api/auctions/:id', async (req, res) => {
  const { id } = req.params;
  const updatedAuctionData = req.body;

  try {
    const updatedAuction = await Auction.findByIdAndUpdate(id, updatedAuctionData, { new: true });
    res.status(200).json(updatedAuction);
  } catch (error) {
    console.error('Error updating auction:', error);
    res.status(500).json({ error: 'Failed to update auction' });
  }
});



  app.listen(PORT,() =>{
  
    console.log('Server is Running...');
  })

  