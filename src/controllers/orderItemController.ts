import { Request, Response } from "express";
import { db } from "../config/db";
import { logError } from "../utilities/logger";
import { IOrderItem } from "../models/IOrderItem";
import { ResultSetHeader } from "mysql2";

export const updateOrderItem = async (req: Request, res: Response) => {
  const id: string = req.params.id;
  const { quantity }: IOrderItem = req.body;

  if (quantity <= 0) {
    res.status(400).json({message: 'Quantity must be greater than 0'})
    return;
  }
  
  try {
    const sql = `
      UPDATE order_items
      SET 
        quantity = ?
      WHERE id = ?
    `;
    const params = [quantity, id];
    const [result] = await db.query<ResultSetHeader>(sql, params)

    const [rows] = await db.query<IOrderItem[]>("SELECT * FROM order_items WHERE id = ?", [id]);
    await updateOrderTotalPrice(rows[0].order_id);
    console.log(rows[0].order_id)

    result.affectedRows === 0
      ? res.status(404).json({message: 'Order item not found'})
      : res.json({message: 'Order item updated'});
  } catch(error) {
    res.status(500).json({error: logError(error)})
  }
}

export const deleteOrderItem = async (req: Request, res: Response) => {
  const id: string = req.params.id;
  
  try {
    const [rows] = await db.query<IOrderItem[]>("SELECT * FROM order_items WHERE id = ?", [id]);
    const sql = "DELETE FROM order_items WHERE id = ?";
    const [result] = await db.query<ResultSetHeader>(sql, [id]);
    await updateOrderTotalPrice(rows[0].order_id);
    
    result.affectedRows === 0
      ? res.status(404).json({message: 'Order item not found'})
      : res.json({message: 'Order item deleted'});
  } catch (error) {
    res.status(500).json({error: logError(error)})
  }
}

const updateOrderTotalPrice = async (order_id: number) => {
  try {
    const sql = `
      UPDATE orders
      SET total_price = (
        SELECT COALESCE(SUM(unit_price * quantity),0) 
        FROM order_items 
        WHERE order_id = ?
      )
      WHERE id = ?
    `;
    const params = [order_id, order_id];
    await db.query(sql, params)
  } catch(error) {
    throw new Error;
  }
}