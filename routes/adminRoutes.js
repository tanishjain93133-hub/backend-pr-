import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Enquiry from '../models/Enquiry.js';
import Testimonial from '../models/Testimonial.js';
import Gallery from '../models/Gallery.js';
import ContactDetail from '../models/ContactDetail.js';
import HomepageContent from '../models/HomepageContent.js';
import WebsiteConfig from '../models/WebsiteConfig.js';
import ActivityLog, { logAdminActivity } from '../models/ActivityLog.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply admin protect validation to all routes in this file
router.use(protect, admin);

// @desc    Get all users (customers)
// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'customer' }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Block or Unblock user
// @route   PUT /api/admin/users/:id/status
router.put('/users/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status parameter' });
    }
    const user = await User.findById(req.params.id);
    if (user) {
      user.status = status;
      await user.save();
      
      await logAdminActivity(
        req.user ? req.user.username : 'admin',
        `${status === 'blocked' ? 'Blocked' : 'Unblocked'} User`,
        `Changed status of user ${user.username} to ${status}`
      );

      res.json({ message: `User status changed to ${status}`, user });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      const username = user.username;
      await User.deleteOne({ _id: req.params.id });
      
      await logAdminActivity(
        req.user ? req.user.username : 'admin',
        'Deleted User Account',
        `Deleted customer account: ${username}`
      );

      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get dashboard analytics metrics
// @route   GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isDeleted: false });
    const totalCategories = await Category.countDocuments({});
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalEnquiries = await Enquiry.countDocuments({});
    
    // Calculate new users registered in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = await User.countDocuments({ 
      role: 'customer', 
      createdAt: { $gte: sevenDaysAgo } 
    });

    // Get Top 5 Most Viewed Products
    const mostViewed = await Product.find({ isDeleted: false })
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort({ viewCount: -1 })
      .limit(5);

    // Get Top 5 Most Requested Products
    const mostRequested = await Product.find({ isDeleted: false })
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort({ enquiryCount: -1 })
      .limit(5);

    // Mock visitor count
    const mockVisitors = 1250 + totalEnquiries * 3 + totalProducts * 15;

    res.json({
      totalProducts,
      totalCategories,
      totalUsers,
      totalEnquiries,
      newUsers,
      visitors: mockVisitors,
      mostViewed,
      mostRequested
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get administrative activity logs
// @route   GET /api/admin/logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Download full database JSON backup
// @route   GET /api/admin/backup
router.get('/backup', async (req, res) => {
  try {
    const backupData = {
      users: await User.find({}),
      products: await Product.find({}),
      categories: await Category.find({}),
      brands: await Brand.find({}),
      enquiries: await Enquiry.find({}),
      testimonials: await Testimonial.find({}),
      gallery: await Gallery.find({}),
      contactDetails: await ContactDetail.find({}),
      homepageContents: await HomepageContent.find({}),
      websiteConfigs: await WebsiteConfig.find({}),
      activityLogs: await ActivityLog.find({})
    };
    
    // Set headers to trigger browser JSON file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=pr_material_house_backup.json');
    res.send(JSON.stringify(backupData, null, 2));

    await logAdminActivity(req.user ? req.user.username : 'admin', 'Backup Database', 'Downloaded a database JSON backup');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Restore database from JSON backup file
// @route   POST /api/admin/restore
router.post('/restore', async (req, res) => {
  try {
    const backupData = req.body;
    
    if (!backupData || typeof backupData !== 'object') {
      return res.status(400).json({ message: 'Invalid backup file format' });
    }

    // Restore collections
    if (backupData.users && backupData.users.length > 0) {
      await User.deleteMany({});
      await User.insertMany(backupData.users);
    }
    if (backupData.products && backupData.products.length > 0) {
      await Product.deleteMany({});
      await Product.insertMany(backupData.products);
    }
    if (backupData.categories && backupData.categories.length > 0) {
      await Category.deleteMany({});
      await Category.insertMany(backupData.categories);
    }
    if (backupData.brands && backupData.brands.length > 0) {
      await Brand.deleteMany({});
      await Brand.insertMany(backupData.brands);
    }
    if (backupData.enquiries && backupData.enquiries.length > 0) {
      await Enquiry.deleteMany({});
      await Enquiry.insertMany(backupData.enquiries);
    }
    if (backupData.testimonials && backupData.testimonials.length > 0) {
      await Testimonial.deleteMany({});
      await Testimonial.insertMany(backupData.testimonials);
    }
    if (backupData.gallery && backupData.gallery.length > 0) {
      await Gallery.deleteMany({});
      await Gallery.insertMany(backupData.gallery);
    }
    if (backupData.contactDetails && backupData.contactDetails.length > 0) {
      await ContactDetail.deleteMany({});
      await ContactDetail.insertMany(backupData.contactDetails);
    }
    if (backupData.homepageContents && backupData.homepageContents.length > 0) {
      await HomepageContent.deleteMany({});
      await HomepageContent.insertMany(backupData.homepageContents);
    }
    if (backupData.websiteConfigs && backupData.websiteConfigs.length > 0) {
      await WebsiteConfig.deleteMany({});
      await WebsiteConfig.insertMany(backupData.websiteConfigs);
    }
    if (backupData.activityLogs && backupData.activityLogs.length > 0) {
      await ActivityLog.deleteMany({});
      await ActivityLog.insertMany(backupData.activityLogs);
    }

    await logAdminActivity(req.user ? req.user.username : 'admin', 'Restore Database', 'Restored database from a JSON backup file');

    res.json({ message: 'Database restored successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all admin/staff users (admin only)
// @route   GET /api/admin/staff
router.get('/staff', async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['admin', 'editor', 'manager'] } }).sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new admin/staff user (admin only)
// @route   POST /api/admin/staff
router.post('/staff', async (req, res) => {
  const { username, email, password, role, permissions } = req.body;
  try {
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'Username, email, password, and role are required' });
    }

    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const newUser = new User({
      username,
      email,
      password, // Mongoose pre-save hook will auto-hash this!
      role,
      permissions: permissions || []
    });

    const savedUser = await newUser.save();
    
    await logAdminActivity(
      req.user ? req.user.username : 'admin',
      'Created Staff User',
      `Created new administrative user: ${username} (Role: ${role})`
    );

    res.status(201).json(savedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update staff user details/permissions (admin only)
// @route   PUT /api/admin/staff/:id
router.put('/staff/:id', async (req, res) => {
  const { role, permissions, status, password } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Staff user not found' });
    }

    user.role = role || user.role;
    user.permissions = permissions !== undefined ? permissions : user.permissions;
    user.status = status || user.status;
    
    if (password) {
      user.password = password; // pre-save hook will hash this!
    }

    const updatedUser = await user.save();

    await logAdminActivity(
      req.user ? req.user.username : 'admin',
      'Updated Staff User',
      `Modified staff account: ${user.username} (Role: ${user.role})`
    );

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete staff user (admin only)
// @route   DELETE /api/admin/staff/:id
router.delete('/staff/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Staff user not found' });
    }

    const username = user.username;
    await User.deleteOne({ _id: req.params.id });

    await logAdminActivity(
      req.user ? req.user.username : 'admin',
      'Deleted Staff User',
      `Deleted staff account: ${username}`
    );

    res.json({ message: 'Staff user removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export { router };
export default router;
