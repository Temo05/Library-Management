const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'თანხა 0-ზე მეტი უნდა იყოს'],
    },
    method: {
      type: String,
      enum: ['cash', 'card'],
      default: 'cash',
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

paymentSchema.index({ member: 1 });
paymentSchema.index({ loan: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
