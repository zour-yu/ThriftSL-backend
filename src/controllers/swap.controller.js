const mongoose = require("mongoose");
const Swap = require("../models/swap.model.js");
const Notification = require("../models/swap.notification.model.js");
const User = require("../models/user");
const Item = require("../models/item");


// GET ALL SWAPS
async function resolveUserObjectId(value) {
    if (!value) return null;

    if (mongoose.Types.ObjectId.isValid(value)) {
        const byId = await User.findById(value).select("_id");
        if (byId) return byId._id;
    }

    const byFirebase = await User.findOne({ firebaseUID: String(value) }).select("_id");
    return byFirebase ? byFirebase._id : null;
}

function firstDefined(body, keys) {
    for (const key of keys) {
        if (body[key] !== undefined && body[key] !== null && body[key] !== "") {
            return body[key];
        }
    }
    return undefined;
}

// GET ALL SWAPS (optional filters by buyer/seller/status)
exports.getSwap = async (req, res) => {
    try {
        const { buyerId, sellerId, status } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (buyerId) {
            const buyerObjectId = await resolveUserObjectId(buyerId);
            if (!buyerObjectId) return res.status(404).json({ success: false, message: "Buyer not found" });
            filter.sUserID = buyerObjectId;
        }
        if (sellerId) {
            const sellerObjectId = await resolveUserObjectId(sellerId);
            if (!sellerObjectId) return res.status(404).json({ success: false, message: "Seller not found" });
            filter.targetOwnerID = sellerObjectId;
        }

        const swaps = await Swap.find(filter)
            .populate("sUserID", "name email phone firebaseUID")
            .populate("targetOwnerID", "name email phone firebaseUID")
            .populate("targetProductID")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: swaps });
    } catch (error) {
        console.log("error in fetching swaps:", error.message);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};


// CREATE SWAP OFFER + NOTIFY SELLER
exports.createSwap = async (req, res) => {
    const body = req.body || {};

    try {
        const rawBuyer = firstDefined(body, ["sUserID", "userId", "buyerId", "buyerID", "firebaseUID"]);
        const rawTargetProduct = firstDefined(body, ["targetProductID", "targetItemID", "itemId"]);
        const rawTargetOwner = firstDefined(body, ["targetOwnerID", "sellerID", "ownerID", "targetOwnerFirebaseUID"]);

        const sTitle = firstDefined(body, ["sTitle", "title"]);
        const sImage = firstDefined(body, ["sImage", "image"]);
        const sDescription = firstDefined(body, ["sDescription", "description"]);
        const sPhoneNumber = firstDefined(body, ["sPhoneNumber", "phone", "phoneNumber"]);
        const sPrice = body.sPrice ?? body.price;
        const topup = body.topup ?? 0;
        const conditionPercentage = body.conditionPercentage ?? body.condition ?? 100;

        if (!rawBuyer || !rawTargetProduct || !sTitle || !sImage || !sDescription || !sPhoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields (buyer, target product, title, image, description, phone).",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(rawTargetProduct)) {
            return res.status(400).json({ success: false, message: "Invalid targetProductID" });
        }

        const [buyerId, targetItem] = await Promise.all([
            resolveUserObjectId(rawBuyer),
            Item.findById(rawTargetProduct).select("_id userId title"),
        ]);

        if (!buyerId) return res.status(404).json({ success: false, message: "Buyer user not found" });
        if (!targetItem) return res.status(404).json({ success: false, message: "Target product not found" });

        let targetOwnerId = targetItem.userId;
        if (rawTargetOwner) {
            const explicitOwner = await resolveUserObjectId(rawTargetOwner);
            if (!explicitOwner) return res.status(404).json({ success: false, message: "Target owner not found" });
            targetOwnerId = explicitOwner;
        }

        if (String(targetItem.userId) !== String(targetOwnerId)) {
            return res.status(400).json({
                success: false,
                message: "targetOwnerID does not match targetProductID owner.",
            });
        }

        const parsedPrice = Number(sPrice);
        const parsedTopup = Number(topup);
        const parsedCondition = Number(conditionPercentage);

        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ success: false, message: "sPrice must be a valid non-negative number." });
        }
        if (Number.isNaN(parsedTopup) || parsedTopup < 0) {
            return res.status(400).json({ success: false, message: "topup must be a valid non-negative number." });
        }
        if (Number.isNaN(parsedCondition) || parsedCondition < 0 || parsedCondition > 100) {
            return res.status(400).json({
                success: false,
                message: "conditionPercentage must be between 0 and 100.",
            });
        }

        const newSwap = await Swap.create({
            sUserID: buyerId,
            targetProductID: targetItem._id,
            targetOwnerID: targetOwnerId,
            sTitle: String(sTitle),
            sImage: String(sImage),
            sDescription: String(sDescription),
            sPrice: parsedPrice,
            sPhoneNumber: String(sPhoneNumber),
            topup: parsedTopup,
            conditionPercentage: parsedCondition,
            status: "pending",
        });

        await Notification.create({
            recipientID: targetOwnerId,
            senderID: buyerId,
            message: `New swap offer received for your item! Offer: ${sTitle}`,
            type: "swap_request",
            swapID: newSwap._id,
            isRead: false,
        });

        res.status(201).json({ success: true, data: newSwap });
    } catch (error) {
        console.error("Error creating swap:", error.message);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};



// UPDATE SWAP DETAILS
exports.updateSwap = async (req, res) => {
    const { id } = req.params;
    const sProduct = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid swap ID" });
    }

    try {
        const updatedSwap = await Swap.findByIdAndUpdate(id, sProduct, { new: true, runValidators: true });
        if (!updatedSwap) return res.status(404).json({ success: false, message: "Swap not found" });

        res.status(200).json({ success: true, data: updatedSwap });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



// DELETE SWAP OFFER
exports.deleteSwap = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid swap ID" });
    }

    try {
        const deletedSwap = await Swap.findByIdAndDelete(id);
        if (!deletedSwap) return res.status(404).json({ success: false, message: "Swap not found" });
        res.status(200).json({ success: true, message: "Swap offer deleted" });
    } catch (error) {
        console.log("error in deleting swapable product:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



// UPDATE STATUS + NOTIFY BUYER
exports.updateOfferStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const sellerIdentifier = firstDefined(req.body || {}, ["sellerID", "targetOwnerID", "ownerID", "sellerFirebaseUID"]);
    const validStatuses = ["pending", "accepted", "rejected"];

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid swap ID" });
    }

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    try {
        const updatedSwap = await Swap.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedSwap) {
            return res.status(404).json({ success: false, message: "Swap offer not found" });
        }

        let sellerId = updatedSwap.targetOwnerID;
        if (sellerIdentifier) {
            const resolvedSeller = await resolveUserObjectId(sellerIdentifier);
            if (resolvedSeller) sellerId = resolvedSeller;
        }

        const type = status === "accepted" ? "swap_accepted" : status === "rejected" ? "swap_rejected" : "swap_request";

        await Notification.create({
            recipientID: updatedSwap.sUserID,
            senderID: sellerId,
            message: `Your swap offer for "${updatedSwap.sTitle}" has been ${status}.`,
            type,
            swapID: updatedSwap._id,
            isRead: false,
        });

        res.status(200).json({ success: true, data: updatedSwap });
    } catch (error) {
        console.error("Error updating status:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



// GET NOTIFICATIONS FOR A USER
exports.getNotifications = async (req, res) => {
    const { userId } = req.params;
    try {
        const resolvedUserId = await resolveUserObjectId(userId);
        if (!resolvedUserId) return res.status(404).json({ success: false, message: "User not found" });

        const notifications = await Notification.find({ recipientID: resolvedUserId })
            .populate("senderID", "name email phone firebaseUID")
            .populate("swapID")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};