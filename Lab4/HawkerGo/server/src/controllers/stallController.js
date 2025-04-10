const Stall = require('../models/Stall');
const Hawker = require('../models/Hawker');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');

// Get all stalls
exports.getAllStalls = async (req, res) => {
  try {
    const stalls = await Stall.find()
      .populate('hawker', 'name location')
      .populate('owner', 'name email');

    res.json(stalls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get stall by ID
exports.getStallById = async (req, res) => {
  try {
    const stall = await Stall.findById(req.params.id)
      .populate('hawker', 'name location operatingHours')
      .populate('owner', 'name email');

    if (!stall) {
      return res.status(404).json({ msg: 'Stall not found' });
    }

    res.json(stall);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Stall not found' });
    }
    
    res.status(500).send('Server Error');
  }
};

// Get stalls by hawker center
exports.getStallsByHawker = async (req, res) => {
  try {
    const stalls = await Stall.find({ hawker: req.params.hawkerId })
      .populate('hawker', 'name location');

    res.json(stalls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get menu items for a stall
exports.getStallMenu = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ stall: req.params.stallId });

    res.json(menuItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Create a stall (stall owner only)
exports.createStall = async (req, res) => {
  try {
    // Check if user is a stall owner
    const user = await User.findById(req.user.id);
    if (user.userType !== 'stallOwner') {
      return res.status(401).json({ msg: 'Not authorized as a stall owner' });
    }

    // Check if user already owns a stall
    const existingStall = await Stall.findOne({ owner: req.user.id });
    if (existingStall) {
      return res.status(400).json({ msg: 'You already own a stall. Each stall owner is limited to one stall.' });
    }

    const {
      name,
      hawkerId,
      description,
      cuisine,
      isHalal,
      isVegetarian,
      isVegan,
      operatingHours,
      minPrice,
      maxPrice
    } = req.body;

    // Check if hawker center exists
    const hawker = await Hawker.findById(hawkerId);
    if (!hawker) {
      return res.status(404).json({ msg: 'Hawker center not found' });
    }

    // Create new stall
    const newStall = new Stall({
      name,
      hawker: hawkerId,
      owner: req.user.id,
      description,
      cuisine,
      isHalal,
      isVegetarian,
      isVegan,
      operatingHours,
      minPrice,
      maxPrice
    });

    const stall = await newStall.save();

    res.json(stall);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update stall (stall owner only)
exports.updateStall = async (req, res) => {
  try {
    let stall = await Stall.findById(req.params.id);
    
    if (!stall) {
      return res.status(404).json({ msg: 'Stall not found' });
    }

    // Make sure user owns the stall
    if (stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const {
      name,
      description,
      cuisine,
      isHalal,
      isVegetarian,
      isVegan,
      operatingHours,
      minPrice,
      maxPrice
    } = req.body;

    // Build stall object
    const stallFields = {};
    if (name) stallFields.name = name;
    if (description) stallFields.description = description;
    if (cuisine) stallFields.cuisine = cuisine;
    if (isHalal !== undefined) stallFields.isHalal = isHalal;
    if (isVegetarian !== undefined) stallFields.isVegetarian = isVegetarian;
    if (isVegan !== undefined) stallFields.isVegan = isVegan;
    if (operatingHours) stallFields.operatingHours = operatingHours;
    if (minPrice) stallFields.minPrice = minPrice;
    if (maxPrice) stallFields.maxPrice = maxPrice;

    // Update stall
    stall = await Stall.findByIdAndUpdate(
      req.params.id,
      { $set: stallFields },
      { new: true }
    );

    res.json(stall);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Add menu item to stall (stall owner only)
exports.addMenuItem = async (req, res) => {
  try {
    const stall = await Stall.findById(req.params.stallId);
    
    if (!stall) {
      return res.status(404).json({ msg: 'Stall not found' });
    }

    // Make sure user owns the stall
    if (stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const {
      name,
      description,
      price,
      isSpicy,
      isSignature,
      isAvailable,
      category
    } = req.body;

    // Create new menu item
    const newMenuItem = new MenuItem({
      stall: req.params.stallId,
      name,
      description,
      price,
      isSpicy,
      isSignature,
      isAvailable,
      category
    });

    const menuItem = await newMenuItem.save();

    res.json(menuItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update menu item (stall owner only)
exports.updateMenuItem = async (req, res) => {
  try {
    let menuItem = await MenuItem.findById(req.params.itemId)
      .populate('stall', 'owner');
    
    if (!menuItem) {
      return res.status(404).json({ msg: 'Menu item not found' });
    }

    // Make sure user owns the stall
    if (menuItem.stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const {
      name,
      description,
      price,
      isSpicy,
      isSignature,
      isAvailable,
      category
    } = req.body;

    // Build menu item object
    const menuItemFields = {};
    if (name) menuItemFields.name = name;
    if (description) menuItemFields.description = description;
    if (price) menuItemFields.price = price;
    if (isSpicy !== undefined) menuItemFields.isSpicy = isSpicy;
    if (isSignature !== undefined) menuItemFields.isSignature = isSignature;
    if (isAvailable !== undefined) menuItemFields.isAvailable = isAvailable;
    if (category) menuItemFields.category = category;

    // Update menu item
    menuItem = await MenuItem.findByIdAndUpdate(
      req.params.itemId,
      { $set: menuItemFields },
      { new: true }
    );

    res.json(menuItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete menu item (stall owner only)
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.itemId)
      .populate('stall', 'owner');
    
    if (!menuItem) {
      return res.status(404).json({ msg: 'Menu item not found' });
    }

    // Make sure user owns the stall
    if (menuItem.stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await MenuItem.findByIdAndRemove(req.params.itemId);

    res.json({ msg: 'Menu item removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};