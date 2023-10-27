const express = require('express');
var cors = require('cors');
const app = express();
const fs = require('fs');
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
    // Create a new item with the provided data
    const newItem = new Item({
      title: title,
      description: description,
      imagePath: imagePath, // Store the image as base64 data
    });

    // Save the item to the database
    await newItem.save();
    res.json(newItem); // Respond with the saved item
  } catch (error) {
    console.error('Error saving item:', error);
    res.status(500).json({ error: 'Failed to save the item' });
  }
});

app.get('/api/item/:id', async (req, res) => {
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

app.delete('/api/item/:id', async (req, res) => {
  try {
    const itemId = req.params.id; // Get the item ID from the URL

    // Check if the item exists before attempting to delete it
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // If the item exists, delete it
    await Item.findByIdAndRemove(itemId);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete the item' });
  }
});


app.put('/api/item/:id', async (req, res) => {
  try {
    const itemId = req.params.id; // Get the item ID from the URL
    const { title, description, imagePath } = req.body;

    // Check if the item exists before attempting to update it
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Update the item's properties
    item.title = title;
    item.description = description;
    item.imagePath = imagePath;

    // Save the updated item
    await item.save();

    res.json(item);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update the blog' });
  }
});


app.use('/api', createProxyMiddleware('/items', { // Proxy only the '/items' route
  target: 'http://localhost:5173/'
  ,
  changeOrigin: true,
  onProxyRes: function (proxyRes, req, res) {
    // Add the necessary headers for CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  }
}));


app.get("/test",(req,res)=>{
  console.log("hello test api is hit")
  res.send({msg:"hello test api is hit"})
})

app.listen(4500, () => {
  console.log('Server is running at 4500');
});