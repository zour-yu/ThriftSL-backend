const express = require("express");

const {
  createSwap,
  deleteSwap,
  getSwap,
  updateSwap,
  updateOfferStatus,
  getNotifications
} = require("../controllers/swap.controller.js");

const router = express.Router();

// GET all swaps
router.get("/", getSwap);

// GET buyer's swaps/statuses
router.get("/buyer/:buyerId", (req, res, next) => {
  req.query.buyerId = req.params.buyerId;
  return getSwap(req, res, next);
});

// GET seller's incoming swap requests/statuses
router.get("/seller/:sellerId", (req, res, next) => {
  req.query.sellerId = req.params.sellerId;
  return getSwap(req, res, next);
});

// CREATE swap
router.post("/", createSwap);

// UPDATE swap
router.put("/:id", updateSwap);

// DELETE swap
router.delete("/:id", deleteSwap);

// UPDATE swap status
router.patch("/:id/status", updateOfferStatus);

// GET notifications
router.get("/notifications/:userId", getNotifications);

module.exports = router;