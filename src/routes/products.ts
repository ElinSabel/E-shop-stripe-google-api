import express from "express";
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from "../controllers/productController";
const router = express.Router();

router.get("/", getProducts)
router.get("/:id", getProductById)
router.post("/", createProduct)
router.patch("/:id", updateProduct)
router.delete("/:id", deleteProduct)

export default router