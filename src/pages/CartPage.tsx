/**
 * @file src/pages/CartPage.tsx
 * @description Customer checkout cart summary page.
 *
 * @why-it-exists
 * Lists items added by the customer, allows modifications to quantities, and triggers checkout flows.
 *
 * @react-commentaries
 * - Why lazy loading is used: Prevents downloading checkout calculation modules during initial browsing.
 * - Why state belongs in Redux: Shopping cart contents must persist across all routes. Storing them in a globally 
 *   accessible Redux slice ensures availability for badging and cross-page synchronization.
 */

import { useEffect } from 'react';
import { Link } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeFromCart, updateQuantity, clearCart } from '@/features/cart/slice/cartSlice';
import { addNotification } from '@/store/slices/notificationSlice';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);

  // Set page meta title for SEO
  useEffect(() => {
    document.title = 'Shopping Cart | E-SHOP';
  }, []);

  // Compute pricing aggregations
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax rate
  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 10.0; // Free shipping over $100
  const grandTotal = subtotal + tax + shipping;

  const handleUpdateQuantity = (productId: number, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    dispatch(updateQuantity({ productId, quantity: newQty }));
  };

  const handleRemove = (productId: number, title: string) => {
    dispatch(removeFromCart(productId));
    dispatch(
      addNotification({
        type: 'info',
        message: `"${title}" has been removed from your cart.`,
      })
    );
  };


  if (cartItems.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">Shopping Cart</h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            View and manage items in your shopping cart.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-white py-16 px-4 text-center dark:border-neutral-800/80 dark:bg-neutral-900/40">
          <div className="rounded-full bg-neutral-50 p-4 text-neutral-400 dark:bg-neutral-850">
            <ShoppingBag size={32} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-neutral-900 dark:text-white">Your Cart is Empty</h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
            It looks like you haven't added any products to your cart yet. Browse our catalog to find items you like.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-650 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            <ArrowLeft size={16} />
            <span>Go to Shop</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">Shopping Cart</h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Manage your selected items before proceeding to checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items List Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-850 dark:bg-neutral-900/50">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Product Details Cell */}
                  <div className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white p-2 border border-neutral-50 dark:border-neutral-800 flex items-center justify-center">
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-450">
                        {item.product.category}
                      </span>
                      <h4 className="font-bold text-neutral-900 line-clamp-1 dark:text-white text-sm hover:text-brand-650 dark:hover:text-brand-400">
                        <Link to={`/products/${item.product.id}`}>{item.product.title}</Link>
                      </h4>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        ${item.product.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  {/* Quantity & Calculations Cell */}
                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    {/* Stepper */}
                    <div className="flex items-center rounded-lg border border-neutral-200 p-0.5 dark:border-neutral-750 dark:bg-neutral-850">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity, -1)}
                        className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-800"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-neutral-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity, 1)}
                        className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-800"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Total Price */}
                    <span className="w-20 text-right font-extrabold text-neutral-900 dark:text-white text-sm">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>

                    {/* Trash remove icon */}
                    <button
                      onClick={() => handleRemove(item.product.id, item.product.title)}
                      className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              <ArrowLeft size={16} />
              <span>Continue Shopping</span>
            </Link>
            <button
              onClick={() => dispatch(clearCart())}
              className="rounded-xl border border-dashed border-red-200 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-950/40 dark:hover:bg-red-950/20"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary Summary Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-850 dark:bg-neutral-900/50 space-y-4">
            <h3 className="font-extrabold text-neutral-900 dark:text-white text-base">Order Summary</h3>

            {/* Calculations lines */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900 dark:text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                <span>Shipping</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {shipping === 0 ? <span className="text-green-600">FREE</span> : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                <span>Estimated Tax (8%)</span>
                <span className="font-semibold text-neutral-900 dark:text-white">${tax.toFixed(2)}</span>
              </div>
              {shipping > 0 && (
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 pt-1">
                  Add <span className="font-bold text-neutral-600 dark:text-neutral-350">${(100 - subtotal).toFixed(2)}</span> more to qualify for <span className="font-bold text-green-600">FREE SHIPPING</span>.
                </div>
              )}
            </div>

            <hr className="border-neutral-100 dark:border-neutral-800" />

            {/* Grand Total */}
            <div className="flex items-center justify-between text-base font-black text-neutral-900 dark:text-white">
              <span>Total</span>
              <span className="text-xl">${grandTotal.toFixed(2)}</span>
            </div>

            {/* Checkout Action Button */}
            <Link
              to="/checkout"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-650 py-3 px-6 text-sm font-semibold text-white shadow-md hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700 transition-all text-center"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
