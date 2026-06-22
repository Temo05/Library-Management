const express = require("express");
const {
  createLoan,
  returnLoan,
  getMyLoans,
  getAllLoans,
  getOverdueLoans,
  getLoanStats,
} = require("../controllers/loanController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/my", getMyLoans);
router.get("/overdue", authorize("librarian", "admin"), getOverdueLoans);
router.get("/stats", authorize("librarian", "admin"), getLoanStats);
router.get("/", authorize("librarian", "admin"), getAllLoans);

router.post("/", createLoan);
router.put("/:id/return", returnLoan);

module.exports = router;
