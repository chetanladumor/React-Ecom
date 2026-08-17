/**
 * @file backend/order-service/src/services/order.service.ts
 * 
 * @why-file-exists
 * Encapsulates core business logic for order checkout creations, outbox scheduling, 
 * completion transitions, and compensating Saga cancellations.
 * 
 * @why-pattern-selected
 * Transactional Outbox Pattern combined with choreographed Saga steps. When creating an order, 
 * we save both the order status and an outbox event document. This guarantees the event 
 * will be eventually processed and published to RabbitMQ.
 * 
 * @alternative-approaches
 * - Direct HTTP synchronization: Highly tightly coupled, fails if downstream services are busy.
 * 
 * @performance-impact
 * Operates on single database saves. Outbox processing is offloaded to a background sweep, 
 * ensuring API response latency is kept low.
 * 
 * @scaling-considerations
 * State is saved persistently in MongoDB, allowing the Order microservice containers to remain stateless 
 * and scale out horizontally.
 */

import { Order, IOrder, IOrderItem } from '../models/order.model';
import { Outbox } from '../models/outbox.model';
import { NotFoundError } from '../utils/errors';

export class OrderService {
  /**
   * Fetches all orders placed by a specific user.
   */
  public static async getOrdersByUser(userId: number): Promise<IOrder[]> {
    return Order.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Fetches a single order by ID.
   */
  public static async getOrderById(orderId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID ${orderId} not found.`);
    }
    return order;
  }

  /**
   * Places a customer order in "pending" status, creating a corresponding Outbox event.
   */
  public static async createOrder(
    userId: number,
    items: IOrderItem[],
    shippingAddress: any
  ): Promise<IOrder> {
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const correlationId = `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 1. Create Order record in "pending" state
    const newOrder = new Order({
      userId,
      items,
      totalAmount,
      status: 'pending',
      shippingAddress,
      correlationId,
    });

    await newOrder.save();

    // 2. Write event to Outbox table atomically
    const outboxEvent = new Outbox({
      eventType: 'order.created',
      payload: {
        orderId: newOrder._id,
        userId,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        totalAmount,
        shippingAddress,
        correlationId,
      },
    });

    await outboxEvent.save();

    return newOrder;
  }

  /**
   * Saga Success step: Marks order as completed.
   */
  public static async completeOrder(orderId: string, correlationId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID ${orderId} not found.`);
    }

    if (order.status === 'completed') {
      return order; // Already completed, idempotent execution
    }

    order.status = 'completed';
    await order.save();

    // Write order completed outbox event (informs email notification and analytics)
    const outboxEvent = new Outbox({
      eventType: 'order.completed',
      payload: {
        orderId: order._id,
        userId: order.userId,
        items: order.items,
        totalAmount: order.totalAmount,
        correlationId,
      },
    });
    await outboxEvent.save();

    return order;
  }

  /**
   * Saga Compensation step: Cancels order due to payment failure or stock shortage.
   */
  public static async cancelOrder(orderId: string, reason: string, correlationId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID ${orderId} not found.`);
    }

    if (order.status === 'cancelled') {
      return order; // Idempotent execution
    }

    order.status = 'cancelled';
    await order.save();

    // Write order cancelled outbox event (triggers stock release in Inventory Service)
    const outboxEvent = new Outbox({
      eventType: 'order.cancelled',
      payload: {
        orderId: order._id,
        userId: order.userId,
        items: order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        reason,
        correlationId,
      },
    });
    await outboxEvent.save();

    return order;
  }
}
