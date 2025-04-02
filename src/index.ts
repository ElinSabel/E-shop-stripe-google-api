import express from "express";
import {connectDB} from "./config/db";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { VercelRequest, VercelResponse } from "@vercel/node";

import dotenv from 'dotenv';
dotenv.config();
export const app = express();

// Middleware
app.use(express.json())
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// Routes
import productRouter from "./routes/products";
import customerRouter from "./routes/customers";
import orderRouter from "./routes/orders";
import orderItemRouter from "./routes/orderItems";
import stripeRouter from "./routes/stripe";
app.use('/products', productRouter)
app.use('/customers', customerRouter)
app.use('/orders', orderRouter)
app.use('/order-items', orderItemRouter)
app.use('/stripe', stripeRouter)

// Attempt to connect to the database
connectDB()
// Start Express server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`The server is running at Port: ${PORT}`);
})

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};