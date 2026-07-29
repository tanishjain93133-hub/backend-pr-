import express from 'express';
import Enquiry from '../models/Enquiry.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

const DEFAULT_ENQUIRIES = [
  {
    _id: '60c72b2f9b1d8b2bad000101',
    fullName: 'Tanish Jain',
    email: 'tanishjain93133@gmail.com',
    phone: '7049845357',
    productName: 'UltraTech Super Cement (50kg Bag)',
    category: 'cement',
    projectDetails: 'Need 500 bags for commercial building construction in Ahmedabad.',
    status: 'New',
    createdAt: new Date()
  },
  {
    _id: '60c72b2f9b1d8b2bad000102',
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    phone: '9876543210',
    productName: 'Jindal Panther TMT Rebars 12mm',
    category: 'steel',
    projectDetails: 'Require 5 tons TMT steel for residential villa project.',
    status: 'Contacted',
    createdAt: new Date(Date.now() - 86400000)
  }
];

let memoryEnquiries = [...DEFAULT_ENQUIRIES];

// @desc    Submit price inquiry
// @route   POST /api/enquiries
router.post('/', async (req, res) => {
  const { fullName, email, phone, productName, category, projectDetails } = req.body;

  const newEnquiryData = {
    _id: '60c72b2f9b1d8b2bad' + Date.now().toString().slice(-6),
    fullName: fullName || 'Valued Customer',
    email: email || '',
    phone: phone || '',
    productName: productName || 'General Material Inquiry',
    category: category || 'General',
    projectDetails: projectDetails || '',
    status: 'New',
    createdAt: new Date()
  };

  try {
    const enquiry = new Enquiry(newEnquiryData);
    const createdEnquiry = await enquiry.save();
    memoryEnquiries.unshift(createdEnquiry);
    return res.status(201).json({ message: 'Enquiry submitted successfully', enquiry: createdEnquiry });
  } catch (error) {
    console.warn('⚠️ Enquiry DB write notice (using fallback memory store):', error.message);
    memoryEnquiries.unshift(newEnquiryData);
    return res.status(201).json({ message: 'Enquiry submitted successfully', enquiry: newEnquiryData });
  }
});

// @desc    Get all enquiries
// @route   GET /api/enquiries
router.get('/', protect, admin, async (req, res) => {
  try {
    const enquiries = await Enquiry.find({}).sort({ createdAt: -1 });
    if (enquiries && enquiries.length > 0) {
      return res.json(enquiries);
    }
    return res.json(memoryEnquiries);
  } catch (error) {
    console.warn('⚠️ Enquiry GET DB Warning (using fallback):', error.message);
    return res.json(memoryEnquiries);
  }
});

// @desc    Update enquiry status
// @route   PUT /api/enquiries/:id
router.put('/:id', protect, admin, async (req, res) => {
  const { status } = req.body;
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (enquiry) {
      enquiry.status = status || enquiry.status;
      const updated = await enquiry.save();
      return res.json(updated);
    }
  } catch (error) {}

  const memEnq = memoryEnquiries.find(e => String(e._id) === String(req.params.id));
  if (memEnq) {
    memEnq.status = status || memEnq.status;
    return res.json(memEnq);
  }

  res.status(404).json({ message: 'Enquiry not found' });
});

// @desc    Delete enquiry
// @route   DELETE /api/enquiries/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await Enquiry.deleteOne({ _id: req.params.id });
  } catch (error) {}
  memoryEnquiries = memoryEnquiries.filter(e => String(e._id) !== String(req.params.id));
  res.json({ message: 'Enquiry deleted successfully' });
});

export { router };
export default router;
