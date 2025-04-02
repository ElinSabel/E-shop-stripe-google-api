import express from "express";
import {
  updateOrderItem,
  deleteOrderItem } from "../controllers/orderItemController"; 
const router = express.Router();


router.patch("/:id", updateOrderItem)
router.delete("/:id", deleteOrderItem)

export default router