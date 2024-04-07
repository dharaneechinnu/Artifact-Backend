require('dotenv').config()
const express = require('express')
const cors = require('cors');
const mongoose = require('mongoose');
const Auction = require('./Model/AddAuction'); // Import the Auction model
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
    const auction = await Auction.findById(id); // Find the auction by ID in the database
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    res.status(200).json(auction);
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
    // Fetch auctions where the creator's userId matches the provided userId
    const userAuctions = await Auction.find({ userId: userId });

    res.status(200).json(userAuctions);
  } catch (error) {
    console.error('Error fetching user auctions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/*Delete by user */
app.delete('/api/auctions/:id', async (req, res) => {
  const auctionId = req.params.id;

  try {
    // Find the auction item by ID and delete it
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
    // Fetch the auction by ID
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Check if the bid amount is valid
    if (isNaN(amount) || amount <= auction.highestBid) {
      return res.status(400).json({ message: 'Invalid bid amount' });
    }

    // Update the auction details with the new bid
    auction.highestBid = amount;
    auction.winningBidder = userId;
    await auction.save();

    // Respond with updated auction details
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




  app.listen(PORT,() =>{
  
    console.log('Server is Running...');
  })

  