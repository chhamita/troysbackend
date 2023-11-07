const express = require('express');
var cors = require('cors');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const multer = require('multer'); 

const routes = require('./routes/routes');
//const multer = require('multer'); // For handling file uploads
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


// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Create an 'uploads' directory for storing uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Rename the file to include a timestamp
  },
});

//const upload = multer({ storage });

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Set the file size limit to 10MB (adjust as needed)
});

// Add an endpoint for creating an item with a file upload
app.post('/api/item', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imagePath = req.file ? req.file.filename : ''; // Get the file path

    // Create a new item with the provided data
    const newItem = new Item({
      title: title,
      description: description,
      imagePath: imagePath, // Store the image path in the database
    });

    // Save the item to the database
    await newItem.save();
    res.status(201).json(newItem); // Respond with the saved item
  } catch (error) {
    console.error('Error saving item:', error);
    res.status(500).json({ error: 'Failed to save the item' });
  }
});

// Add an endpoint for file uploads
app.post('/api/upload', upload.single('image'), (req, res) => {
  // 'image' is the name of the field in the form
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.status(201).json({ imagePath: req.file.filename });
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

// Add an endpoint for updating an item with a file upload
app.put('/api/item/:id', upload.single('image'), async (req, res) => {
  try {
    const itemId = req.params.id;
    const { title, description } = req.body;
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update the item's title and description
    item.title = title;
    item.description = description;

    // Check if a new image file was provided
    if (req.file) {
      const imagePath = req.file.filename; // Get the file path
      item.imagePath = imagePath;
    }

    await item.save();
    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update the item' });
  }
});

app.use('/api', createProxyMiddleware('/items', { // Proxy only the '/items' route
  target: 'https://troyswildweather.com/'
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
  console.log("hello test api is hit1")
  res.send({msg:"hello test api is hit1"})
})

// Increase payload size limit (e.g., 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


console.log("test data added");
app.use('/uploads', express.static('uploads'));
app.listen(4500, () => {
  console.log('Server is running at 4500');
});