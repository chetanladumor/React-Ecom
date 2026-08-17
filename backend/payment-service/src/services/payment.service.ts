/**
 * @file backend/payment-service/src/services/payment.service.ts
 * 
 * @why-file-exists
 * Encapsulates payment gateway logic, recording successes/declines in MongoDB.
 * 
 * @why-pattern-selected
 * Gateway Wrapper pattern. Centralizes interaction with payment gateways (mocked). 
 * Supports mock card declines based on amount suffixes to test compensating Saga flows.
 * 
 * @alternative-approaches
 * - Processing payment logic inline inside event subscribers: Leads to duplicate code 
 *   and makes unit testing with mock processors difficult.
 * 
 * @performance-impact
 * Mocked execution runs in constant time. In production, this would make external HTTP calls 
 * to Stripe/PayPal (wrapped in async retry policies).
 * 
 * @scaling-considerations
 * State is saved persistently in MongoDB, allowing the Payment microservice containers to remain stateless 
 * and scale out horizontally.
 */

import { Transaction, ITransaction } from '../models/transaction.model';
import { PaymentDeclinedError } from '../utils/errors';

export class PaymentService {
  /**
   * Mocks payment processing. 
   * If the transaction amount ends in exactly `.99` (e.g. 99.99, 10.99), the payment is declined.
   * This provides a predictable test pathway for verifying Saga stock-release compensation rollbacks!
   */
  public static async processPayment(
    orderId: string,
    userId: number,
    amount: number
  ): Promise<ITransaction> {
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const stringAmount = amount.toFixed(2);
    const isDeclined = stringAmount.endsWith('.99');

    if (isDeclined) {
      const failedTxn = new Transaction({
        orderId,
        userId,
        amount,
        status: 'failed',
        transactionId,
        error: 'Insufficient funds on credit card account.',
      });
      await failedTxn.save();
      throw new PaymentDeclinedError(`Payment failed: ${failedTxn.error}`);
    }

    const successTxn = new Transaction({
      orderId,
      userId,
      amount,
      status: 'success',
      transactionId,
    });
    await successTxn.save();

    return successTxn;
  }
}
