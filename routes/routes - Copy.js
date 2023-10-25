const express = require('express');
const router = express.Router();
module.exports = router;
const imageUtils = require('../imageUtils'); 
const Item = require('../models/item');

router.post('/items', async (req, res) => {
  try {
    const { title, description, base64Image } = req.body;
    // Convert base64 to a Buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const newItem = new Item({ title, description, image: imageBuffer });
    
    await newItem.save();
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create the item' });
  }
});

// Get all items with base64 image URLs
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

// Get a specific item by ID with a base64 image URL
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
/********************** */
// Update an item
router.put('/items/:id', async (req, res) => {
  try {
    const { title, description, imagePath } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    item.title = title;
    item.description = description;
    item.imagePath = imagePath;
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update the item' });
  }
});


module.exports = router;