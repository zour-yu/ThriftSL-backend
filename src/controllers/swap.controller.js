import mongoose from 'mongoose';
import Swap from '../models/swap.model.js';
import Notification from '../models/swap.notification.model.js';

// GET ALL SWAPS
export const getSwap = async (req, res) => {
    try {
        const sProduct = await Swap.find({});
        res.status(200).json({ success: true, data: sProduct });
    } catch (error) {
        console.log("error in fetching product:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



// CREATE SWAP OFFER + NOTIFY SELLER
export const createSwap = async (req, res) => {
    const sProduct = req.body; 
    // Validation
    if (!sProduct.sUserID || 
        !sProduct.targetProductID || 
        !sProduct.targetOwnerID || // Added this: We need to know who to notify!
        !sProduct.sTitle || 
        !sProduct.sImage || 
        !sProduct.sDescription || 
        !sProduct.sPrice || 
        !sProduct.sPhoneNumber || 
        !sProduct.topup || 
        !sProduct.conditionPercentage) {
        return res.status(400).json({ success: false, message: "Please provide all fields, including targetOwnerID" });
    }
    const newSwap = new Swap(sProduct);
    try {
        await newSwap.save();

        // 1st NOTIFICATION: Notify the Seller that they have a new offer
        const sellerNotification = new Notification({
            recipientID: sProduct.targetOwnerID, 
            senderID: sProduct.sUserID,
            message: `New swap offer received for your item! Offer: ${sProduct.sTitle}`,
            swapID: newSwap._id,
            isRead: false
        });
        await sellerNotification.save();

        res.status(201).json({ success: true, data: newSwap });
    } catch (error) {
        console.error("Error in Create product:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



// UPDATE SWAP DETAILS
export const updateSwap = async (req, res) => {
    const { id } = req.params;
    const sProduct = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid Swapable Product ID" });
    }

    try {
        const updatedSwap = await Swap.findByIdAndUpdate(id, sProduct, { new: true });
        if (!updatedSwap) return res.status(404).json({ success: false, message: "Product not found" });

        res.status(200).json({ success: true, data: updatedSwap });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



// DELETE SWAP OFFER
export const deleteSwap = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid Swapable Product ID" });
    }

    try {
        await Swap.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Swapable Product Deleted" });
    } catch (error) {
        console.log("error in deleting swapable product:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



// UPDATE STATUS + NOTIFY BUYER
export const updateOfferStatus = async (req, res) => {
    const { id } = req.params; 
    const { status, sellerID } = req.body; // Added sellerID to track who sent the update
    const validStatuses = ['pending', 'accepted', 'rejected'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
    }
    try {
        const updatedSwap = await Swap.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedSwap) {
            return res.status(404).json({ success: false, message: "Swap offer not found" });
        }

        // 2nd NOTIFICATION: Notify the Buyer about the Seller's decision
        const buyerNotification = new Notification({
            recipientID: updatedSwap.sUserID, 
            senderID: sellerID, 
            message: `Your swap offer for "${updatedSwap.sTitle}" has been ${status}.`,
            swapID: updatedSwap._id,
            isRead: false
        });
        await buyerNotification.save();

        res.status(200).json({ success: true, data: updatedSwap });
    } catch (error) {
        console.error("Error updating status:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



// GET NOTIFICATIONS FOR A USER
export const getNotifications = async (req, res) => {
    const { userId } = req.params;
    try {
        const notifications = await Notification.find({ recipientID: userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};