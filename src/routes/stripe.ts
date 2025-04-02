import express from 'express'
import { 
  checkoutSessionEmbedded,  
  webhook } from '../controllers/stripeController';
const router = express.Router()

router.post('/create-checkout-session-embedded', checkoutSessionEmbedded)
router.post('/webhook', webhook)

export default router;