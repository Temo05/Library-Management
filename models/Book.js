const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'სათაურის შევსება სავალდებულოა'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN-ის შევსება სავალდებულოა'],
      unique: true,
      trim: true,
    },
    authors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author',
        required: true,
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    publisher: {
      type: String,
      trim: true,
    },
    publishedYear: {
      type: Number,
    },
    language: {
      type: String,
      default: 'ქართული',
    },
    totalCopies: {
      type: Number,
      required: true,
      min: [1, 'ეგზემპლარების რაოდენობა მინიმუმ 1 უნდა იყოს'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      default: function () {
        return this.totalCopies;
      },
    },
    coverImage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

bookSchema.index({ category: 1 });

bookSchema.virtual('isAvailable').get(function () {
  return this.availableCopies > 0;
});
bookSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Book', bookSchema);
