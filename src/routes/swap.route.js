import express from "express";
import { createSwap, deleteSwap, getSwap, updateSwap ,updateOfferStatus ,getNotifications} from "../controllers/swap.controller.js";

const router = express.Router();

router.get("/", getSwap);
router.post("/", createSwap);
router.put("/:id", updateSwap);
router.delete("/:id", deleteSwap);
router.patch("/:id/status", updateOfferStatus);
router.get("/notifications/:userId", getNotifications);

export default router;