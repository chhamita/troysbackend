const express = require('express');
var cors = require('cors');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
})
const upload = multer({ storage: storage })

const routes = require('./routes/routes');
//const multer = require('multer'); // For handling file uploads
const Item = require('./models/item');
const url = process.env.DATABASE_URL;
const client = new MongoClient(url);
//const cors = require('cors');

app.use(cors()); // Enable CORS for all routes before defining your routes
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
console.log('awsAccessKeyId=>',awsAccessKeyId);
console.log('yourSecretAccessKey=>',yourSecretAccessKey);
// Configure AWS SDK
AWS.config.update({
  accessKeyId: awsAccessKeyId,
  secretAccessKey: yourSecretAccessKey,
  region: 'us-east-1',
});

const s3 = new AWS.S3();




app.post('/api/item', upload.single('image'), async (req, res) => {
  console.log(req.body);
  console.log('filee-->',req.file);
  try {
    const { title, description } = req.body;
    const imagePath = req.file ? req.file.path : ''; // Get the file path

    console.log(req.body);
    console.log(imagePath, "imagePath");
    console.log('Before creating newItem');
    // Create a new item with the provided data
    const newItem = new Item({
      title: title,
      description: description,
      imagePath: imagePath, // Store the image path in the database
    });
    console.log('After creating newItem');
    const bucketName = 'troysimages';
    const fileContent = fs.readFileSync(`./${imagePath}`);
    const objectKey = imagePath;

    const params = {
      Bucket: bucketName,
      Key: objectKey,
      Body: fileContent,
    };

    const { err, data } = await s3.upload(params).promise();

    if (err) {
      console.error('Error uploading image:', err);
      return res.status(500).json({ error: err.message });
    }

    // Save the item to the database after successful S3 upload
    await newItem.save();
    
    // Respond with the saved item and image URL
    res.status(201).json({
      newItem: newItem,
      imageUrl: data.Location,
    });
  } catch (error) {
    console.error('Error saving item:', error);
    res.status(500).json({ error: `Failed to save the item. ${error.message}` });
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

app.use('/api', createProxyMiddleware('/items', { // Proxy only the '/items' route
  target: 'http://localhost:5174/'
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

// Increase payload size limit (e.g., 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


console.log("test data added");
//app.use('/uploads', express.static('uploads'));

app.listen(4500, () => {
  console.log('Server is running at 4500');
});


