const express = require('express');
const {
  createReview,
  updateReview,
  deleteReview,
  getBookReviews,
  getMyReviews,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/book/:bookId', getBookReviews); 

router.use(protect);

router.get('/my', getMyReviews);
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;
