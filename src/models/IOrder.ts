import { RowDataPacket } from "mysql2";
import { IOrderItem } from "./IOrderItem";

export interface IOrder extends RowDataPacket {
  id: number | null
  customer_id: number
  total_price: number
  payment_status: string
  payment_id: string
  order_status: string
  created_at: string
  customer_firstname: string
  customer_lastname: string
  customer_email: string
  customer_phone: string
  customer_street_address: string
  customer_postal_code: string
  customer_city: string
  customer_country: string
  customers_created_at: string
  order_items: IOrderItem[]
}