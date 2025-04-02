import { Request, Response } from "express";
import { db } from "../config/db";
import { ResultSetHeader } from "mysql2";
import nodemailer from "nodemailer";
import { STRIPE_SECRET_KEY } from "../constants/env";
import { EMAIL_USER } from "../constants/env";
import { EMAIL_PASS } from "../constants/env";

const stripe = require("stripe")(STRIPE_SECRET_KEY);

const sendConfirmationEmail = async (
  customerEmail: string,
  orderId: string
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: customerEmail,
    subject: `Order Confirmation - ${orderId}`,
    text: `Hello! Your order with ID ${orderId} has been successfully placed. Thank you for shopping with us!`,
    html: `
      <h1>Thank you for your order!</h1>
      <p>Your order with ID <strong>${orderId}</strong> has been successfully placed and is being processed.</p>
      <p>We will notify you once your order is shipped.</p>
      <p>Thank you for shopping with us!</p>
      <h2>THIS IS JUST A TEST!</h2>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent successfully");
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
};

export const checkoutSessionEmbedded = async (req: Request, res: Response) => {
    const { cart, orderId, customerEmail } = req.body;

    try {
      const lineItems = cart.map((item: { product: { name: string; image: string; description: string; id: number; price: number; }; quantity: number; }) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product.name,
            images: [item.product.image],
            description: item.product.description,
            metadata: { product_id: item.product.id },
          },
          unit_amount: item.product.price * 100,
        },
        quantity: item.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: "payment",
        ui_mode: "embedded",
        return_url: `http://localhost:5173/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        client_reference_id: orderId,
        customer_email: customerEmail,
      });

      res.send({ clientSecret: session.client_secret });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).send("Internal server error");
    }
  }


export const webhook = async (req: Request, res: Response) => {
    const event = req.body;

    if (event.type === "checkout.session.completed") {
        const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
            expand: ["line_items.data.price.product"],
        });

        const orderId = session.client_reference_id;
        const paymentId = session.id;
        const customerEmail = session.customer_email;
        const lineItems = session.line_items.data.map((item: { price: { product: { metadata: { product_id: number; }; }; }; quantity: number; }) => ({
            productId: item.price.product.metadata.product_id,
            quantity: item.quantity,
        }));

        try {
            const sqlOrder = `UPDATE orders 
        SET payment_status = 'Paid', payment_id = ?, order_status = 'Received' 
        WHERE id = ?;`;
            await db.query<ResultSetHeader>(sqlOrder, [paymentId, orderId]);
        
            await sendConfirmationEmail(customerEmail, orderId);
        
            for (const item of lineItems) {
                const sqlProduct = `UPDATE products 
          SET stock = stock - ? 
          WHERE id = ?;`;
                await db.query<ResultSetHeader>(sqlProduct, [item.quantity, item.productId]);
            }
        
            console.log("Order and stock updated successfully");
        } catch (error) {
            console.error("Error updating order or stock:", error);
        }
    } else {
        console.log(`Unhandled event type: ${event.type}`);
        res.json({ received: true });
    }
};
