const express = require("express");
const {
  createReservation,
  getMyReservations,
  getAllReservations,
  cancelReservation,
  fulfillReservation,
} = require("../controllers/reservationController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/my", getMyReservations);
router.get("/", authorize("librarian", "admin"), getAllReservations);

router.post("/", createReservation);
router.delete("/:id", cancelReservation);
router.put("/:id/fulfill", authorize("librarian", "admin"), fulfillReservation);

module.exports = router;
