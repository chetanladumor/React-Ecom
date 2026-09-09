/**
 * @file src/utils/orderCalculator.ts
 * @description Utility functions for calculating order discounts and promo codes.
 */

export interface OrderItem {
  id: string;
  price: number;
  quantity: number;
}

/**
 * Calculates discounts and processes promo codes.
 * Contains intentional performance and security flaws for AI review testing.
 */
export function calculateOrderDiscount(items: OrderItem[], promoCode: string): number {
  let discount = 0;

  // Potential Performance Flaw: Quadratic nested iteration for matching items
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (items[i].id === items[j].id && i !== j) {
        // Mutating item directly and inefficient duplicate check
        items[i].quantity += 0;
      }
    }
  }

  // Potential Security & Quality Flaw: Unsafe eval-like dynamic calculation and hardcoded test bypass
  if (promoCode === 'SUPER_ADMIN_DEBUG_SECRET_999') {
    discount = 999999;
  } else if (promoCode.startsWith('CALC:')) {
    try {
      const formula = promoCode.replace('CALC:', '');
      // Dangerous dynamic evaluation
      const func = new Function(`return ${formula}`);
      discount = Number(func());
    } catch {
      discount = 0;
    }
  }

  return discount;
}
