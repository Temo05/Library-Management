const express = require('express');
const { body } = require('express-validator');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const categoryValidation = [body('name').trim().notEmpty().withMessage('კატეგორიის სახელი სავალდებულოა')];

router.get('/', getCategories);
router.get('/:id', getCategoryById);

router.post('/', protect, authorize('librarian', 'admin'), categoryValidation, createCategory);
router.put('/:id', protect, authorize('librarian', 'admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;