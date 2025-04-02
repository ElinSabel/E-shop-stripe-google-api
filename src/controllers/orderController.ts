import { Request, Response } from "express";
import { db } from "../config/db";
import { IOrderItem } from "../models/IOrderItem";
import { IOrder } from "../models/IOrder";
import { logError } from "../utilities/logger";
import { ResultSetHeader } from "mysql2";

export const getOrders = async (_: any, res: Response) => {
  try {
    const sql = `
      SELECT 
        orders.id AS id, 
        customer_id,
        total_price,
        payment_status,
        payment_id,
        order_status,
        orders.created_at,
        customers.id AS customer_id, 
        firstname AS customer_firstname, 
        lastname AS customer_lastname, 
        email AS customer_email, 
        firstname AS customer_firstname, 
        lastname AS customer_lastname,
        email AS customer_email,
        phone AS customer_phone,
        street_address AS customer_street_address,
        postal_code AS customer_postal_code,
        city AS customer_city,
        country AS customer_country,
        customers.created_at AS customers_created_at,
        orders.created_at AS created_at
      
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.id`;
    const [rows] = await db.query<IOrder[]>(sql)
    res.json(rows);
  } catch (error) {
    res.status(500).json({error: logError(error)})
  }
}

export const getOrderById = async (req: Request, res: Response) => {
  const id: string = req.params.id;
  
  try {
    const sql = `
      SELECT 
        *, 
        orders.id AS order_id,
        orders.created_at AS orders_created_at, 
        customers.created_at AS customers_created_at 
      FROM orders 
      LEFT JOIN customers ON orders.customer_id = customers.id
      LEFT JOIN order_items ON orders.id = order_items.order_id
      WHERE orders.id = ?
    `;
    const [rows] = await db.query<IOrder[]>(sql, [id])
    // res.json(rows)
    // return;

    rows && rows.length > 0
      ? res.json(formatOrderDetails(rows))
      : res.status(404).json({message: 'Order not found'})
  } catch (error) {
    res.status(500).json({error: logError(error)})
  }
}


export const getOrderByPaymentId = async (req: Request, res: Response) => {
  const id: string = req.params.id;
  
  try {
    const sql = `
      SELECT 
        *, 
        orders.id AS order_id,
        orders.created_at AS orders_created_at, 
        customers.created_at AS customers_created_at 
      FROM orders 
      LEFT JOIN customers ON orders.customer_id = customers.id
      LEFT JOIN order_items ON orders.id = order_items.order_id
      WHERE orders.payment_id = ?
    `;
    const [rows] = await db.query<IOrder[]>(sql, [id])
    // res.json(rows)
    // return;

    rows && rows.length > 0
      ? res.json(formatOrderDetails(rows))
      : res.status(404).json({message: 'Order not found'})
  } catch (error) {
    res.status(500).json({error: logError(error)})
  }
}

const formatOrderDetails = (rows: IOrder[]) => ({
  id: rows[0].order_id,
  customer_id: rows[0].customer_id,
  total_price: rows[0].total_price,
  payment_status: rows[0].payment_status,
  payment_id: rows[0].payment_id,
  order_status: rows[0].order_status,
  created_at: rows[0].orders_created_at,
  customer_firstname: rows[0].firstname,
  customer_lastname: rows[0].lastname,
  customer_email: rows[0].email,
  customer_password: rows[0].password,
  customer_phone: rows[0].phone,
  customer_street_address: rows[0].street_address,
  customer_postal_code: rows[0].postal_code,
  customer_city: rows[0].city,
  customer_country: rows[0].country,
  order_items: rows[0].id ? rows.map(item => ({
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_image: item.product_image,
    quantity: item.quantity,
    unit_price: item.unit_price
  })) : []
});

export const createOrder = async (req: Request, res: Response) => {
  const { customer_id, payment_status, payment_id, order_status }: IOrder = req.body;
  
  try {
    const sql = `
      INSERT INTO orders (customer_id, total_price, payment_status, payment_id, order_status)
      VALUES (?, ?, ?, ?, ?)
    `;

    const totalPrice = req.body.order_items.reduce((total: number, item: IOrderItem) => total + (item.quantity * item.unit_price), 0);
    const params = [customer_id, totalPrice, payment_status, payment_id, order_status]
    const [result] = await db.query<ResultSetHeader>(sql, params)
    if (result.insertId) {
      const order_id: number = result.insertId;
      const orderItems = req.body.order_items;
      for (const orderItem of orderItems) {
        const data = {...orderItem, order_id}
        await createOrderItem(data)
      };
    }

    res.status(201).json({message: 'Order created', id: result.insertId});
  } catch(error: unknown) {
    res.status(500).json({error: logError(error)})
  }
}

const createOrderItem = async (data: IOrderItem) => {
  const {order_id, product_id, product_name, product_image ,quantity, unit_price} = data;
  try {
    const sql = `
      INSERT INTO order_items (
        order_id, 
        product_id, 
        product_name,
        product_image,
        quantity, 
        unit_price 
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [order_id, product_id, product_name, product_image, quantity, unit_price]
    await db.query<ResultSetHeader>(sql, params)
  } catch(error) {
    throw new Error;
  }
}

export const updateOrder = async (req: Request, res: Response) => {
  const id: string = req.params.id;
  const { payment_status, payment_id, order_status }: IOrder = req.body;
  
  try {
    const sql = `
      UPDATE orders 
      SET payment_status = ?, payment_id = ?,order_status = ?
      WHERE id = ?
    `;
    const params = [payment_status, payment_id, order_status, id];
    const [result] = await db.query<ResultSetHeader>(sql, params)

    result.affectedRows === 0
      ? res.status(404).json({message: 'Order not found'})
      : res.json({message: 'Order updated'});
  } catch(error) {
    res.status(500).json({error: logError(error)})
  }
}

export const deleteOrder = async (req: Request, res: Response) => {
  const id: string = req.params.id;
  
  try {
    const sql = "DELETE FROM orders WHERE id = ?";
    const [result] = await db.query<ResultSetHeader>(sql, [id]);
    
    result.affectedRows === 0
      ? res.status(404).json({message: 'Order not found'})
      : res.json({message: 'Order deleted'});
  } catch (error) {
    res.status(500).json({error: logError(error)})
  }
}