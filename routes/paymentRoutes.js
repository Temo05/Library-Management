const express = require('express');
const {
  createPayment,
  getMyPayments,
  getAllPayments,
  getOutstandingFines,
  getPaymentStats,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my', getMyPayments);
router.get('/outstanding', authorize('librarian', 'admin'), getOutstandingFines);
router.get('/stats', authorize('librarian', 'admin'), getPaymentStats);
router.get('/', authorize('librarian', 'admin'), getAllPayments);

router.post('/', createPayment);