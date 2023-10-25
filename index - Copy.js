const express = require('express');
var cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const routes = require('./routes/routes');
const multer = require('multer'); // For handling file uploads
const Item = require('./models/item');
const url = process.env.DATABASE_URL;
const client = new MongoClient(url);

app.use('/api', routes)
app.use(cors());
const { createProxyMiddleware } = require('http-proxy-middleware');

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const database = mongoose.connection; 

database.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

database.once('open', () => {
    console.log('Connected to MongoDB');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/item', async (req, res) => {
  try {
    const { title, description, imagePath } = req.body;
    // Convert the base64 image to binary data
    const imageBuffer = Buffer.from(imagePath, 'base64');
    // Create a new item with the provided data
    const newItem = new Item({
      title: title,
      description: description,
      imagePath: imageBuffer, // Save the binary image data
    });

    // Save the item to the database
    await newItem.save();

    console.log('Item saved to the "items" collection:', newItem);
    res.json(newItem); // Respond with the saved item
  } catch (error) {
    console.error('Error saving item:', error);
    res.status(500).json({ error: 'Failed to save the item' });
  }
});


app.get('/api/items/:id', async (req, res) => {
  try {
    const itemId = req.params.id; // Get the item ID from the URL
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve the item' });
  }
});

/*
app.get('/api/item', (req, res) => {
  Item.find({})
    .exec()
    .then((items) => {
      res.json(items);
    })
    .catch((err) => {
      console.error('Error fetching items:', err);
      res.status(500).json({ error: 'Error fetching items' });
    });
});
*/

/*
app.get('/api/item', (req, res) => {
  Item.find({})
    .exec()
    .then((items) => {
      const itemsWithBase64Images = items.map((item) => {
        // Log the item here
        console.log('item=>',item);
      
      });

      res.json(items);
    })
    .catch((err) => {
      console.error('Error fetching items:', err);
      res.status(500).json({ error: 'Error fetching items' });
    });
});
*/

app.get('/api/item', (req, res) => {
  Item.find({})
    .exec()
    .then((items) => {
      // console.log('Items:', items);
      const itemsWithBase64Images = items.map((item) => {
        console.log('Items====>:', item.imagePath);
        //const base64 = Buffer.from(item.imagePath).toString('base64');
        //console.log('base64=>:', base64);
        // Convert the Buffer to a base64 string
        return {
          _id: item._id,
          title: item.title,
          description: item.description,
          //base64Image: Buffer.from(item.imagePath).toString('base64'),
        };
      });

      res.json(itemsWithBase64Images);
    })
    .catch((err) => {
      console.error('Error fetching items:', err);
      res.status(500).json({ error: 'Error fetching items' });
    });
});



app.use('/api', createProxyMiddleware({ 
  target: 'http://localhost:5173/', //original url
  changeOrigin: true, 
  //secure: false,
  onProxyRes: function (proxyRes, req, res) {
     proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  }
}));

app.listen(4500, () => {
  console.log('Server is running at 4500');
});