const express = require('express');
const router = express.Router();
module.exports = router;
const multer = require('multer'); // For handling file uploads 
const Item = require('../models/item');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Specify the same 'uploads' directory as in index.js
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Rename the file to include a timestamp
  },
});

const upload = multer({ storage });

/*
router.post('/items', upload.single('image'), async (req, res) => {
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
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create the item' });
  }
});


router.get('/items', async (req, res) => {
  try {
    const items = await Item.find();


    // Convert images to base64 URLs
    const itemsWithBase64Image = items.map((item) => ({
      title: item.title,
      description: item.description,
      base64Image: item.imagePath.toString('base64')
    }));

    res.json(itemsWithBase64Image);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve items' });
  }
});


router.get('/items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const itemWithBase64Image = {
      title: item.title,
      description: item.description,
      base64Image: item.imagePath.toString('base64')
    };

    res.json(itemWithBase64Image);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve the item' });
  }
});

router.put('/items/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update the item data
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
    res.status(500).json({ error: 'Failed to update the item' });
  }
});
*/

router.post('/items', upload.single('image'), async (req, res) => {
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

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create the item' });
  }
});

// Get all items
router.get('/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve items' });
  }
});

// Get a specific item by ID
router.get('/items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve the item' });
  }
});

// Update an item
router.put('/items/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update the item data
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
    res.status(500).json({ error: 'Failed to update the item' });
  }
});

module.exports = router;