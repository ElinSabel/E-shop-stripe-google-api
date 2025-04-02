import express from "express";
import { 
  getCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  getCustomerByEmail} from "../controllers/customerController";
const router = express.Router();

router.get("/", getCustomers)
router.get("/:id", getCustomerById)
router.get("/email/:email", getCustomerByEmail)
router.post("/", createCustomer)
router.patch("/:id", updateCustomer)
router.delete("/:id", deleteCustomer)

export default router