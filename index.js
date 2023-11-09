const express = require('express');
var cors = require('cors');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage })

const routes = require('./routes/routes');

const Item = require('./models/item');
const url = process.env.DATABASE_URL;
const client = new MongoClient(url);

app.use(cors()); 
app.use('/api', routes);
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

const AWS = require('aws-sdk');

const awsAccessKeyId = process.env.YOUR_ACCESS_KEY_ID
const yourSecretAccessKey = process.env.YOUR_SECRET_ACCESS_KEY

AWS.config.update({
  accessKeyId: awsAccessKeyId,
  secretAccessKey: yourSecretAccessKey,
  region: 'us-east-1',
});

const s3 = new AWS.S3();

app.post('/api/item', upload.single('image'), async (req, res) => {

  try {
    const { title, description } = req.body
    const file = req.file

    if (!file) return res.status(400).json({ error: 'No file provided' })

    const bucketName = 'troysimages'

    const params = {
      'Bucket': bucketName,
      'Key': `uploads/${file.originalname}`,
      'Body': file.buffer,
      'ContentType': file.mimetype
    }

    const { key } = await s3.upload(params).promise()

    const blogObject = new Item({
      'title': title,
      'description': description,
      'imagePath': `${key}`
    })

    if (key) await blogObject.save()

    res.status(201).json({
      newItem: blogObject
    });
  } catch (error) {
    console.error('Error saving item:', error);
    res.status(500).json({ error: `Failed to save the item. ${error.message}` });
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
      // const imagePath = req.file.filename; // Get the file path
      const imagePath = req.file.filename;
      item.imagePath = imagePath;
    }

    await item.save();
    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update the item' });
  }
});

app.use('/api', createProxyMiddleware('/items', { 
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


app.get("/test", (req, res) => {
  console.log("hello test api is hit1")
  res.send({ msg: "hello test api is hit1" })
})

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.listen(4500, () => {
  console.log('Server is running at 4500');
});


