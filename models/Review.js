const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'შეფასების მითითება სავალდებულოა'],
      min: [1, 'შეფასება უნდა იყოს 1-დან 5-მდე'],
      max: [5, 'შეფასება უნდა იყოს 1-დან 5-მდე'],
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

reviewSchema.index({ book: 1, member: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
