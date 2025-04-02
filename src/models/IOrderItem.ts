import { RowDataPacket } from "mysql2";

export interface IOrderItem extends RowDataPacket {
  id: number | null
  order_id: number
  product_id: number
  product_name: string
  product_image: string
  quantity: number
  unit_price: number
  created_at: string
}