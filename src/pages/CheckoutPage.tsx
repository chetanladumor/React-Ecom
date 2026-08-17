/**
 * @file src/pages/CheckoutPage.tsx
 * @description Customer checkout address entry and credit card mock payments form page.
 *
 * @why-it-exists
 * Validates shipping address and payment details, submits order creations, 
 * clears the shopping bag, and redirects customers to their order history list.
 */

import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCart } from '@/features/cart/slice/cartSlice';
import { createOrder } from '@/features/orders/slice/ordersSlice';
import { addNotification } from '@/store/slices/notificationSlice';
import { ArrowLeft, CreditCard, Landmark } from 'lucide-react';
import type { Resolver } from 'react-hook-form';

// Checkout Zod Validation Schema
const checkoutSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  street: z.string().min(5, 'Street address must be at least 5 characters'),
  city: z.string().min(2, 'City name is too short'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP code (e.g. 12345)'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  
  cardholderName: z.string().min(3, 'Cardholder name is required'),
  cardNumber: z.string().regex(/^\d{16}$/, 'Enter a valid 16-digit card number'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Enter expiry as MM/YY'),
  cvv: z.string().regex(/^\d{3}$/, 'Enter a 3-digit CVV'),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cartItems = useAppSelector((state) => state.cart.items);

  // Set page meta title for SEO
  useEffect(() => {
    document.title = 'Secure Checkout | E-SHOP';
  }, []);

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cartItems, navigate]);

  // Compute pricing aggregations
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 100 ? 0 : 10.0;
  const grandTotal = subtotal + tax + shipping;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema) as unknown as Resolver<CheckoutFormValues>,
    defaultValues: {
      fullName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      cardholderName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
  });

  const onSubmit = (data: CheckoutFormValues) => {
    const orderItems = cartItems.map((item) => ({
      productId: item.product.id,
      productTitle: item.product.title,
      productImage: item.product.image,
      price: item.product.price,
      quantity: item.quantity,
    }));

    // Dispatch createOrder to Redux
    dispatch(
      createOrder({
        items: orderItems,
        subtotal,
        tax,
        shipping,
        total: grandTotal,
        shippingAddress: {
          fullName: data.fullName,
          street: data.street,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        },
        paymentMethod: `Credit Card (ending in ${data.cardNumber.slice(-4)})`,
      })
    );

    // Clear shopping cart
    dispatch(clearCart());

    // Show success notification
    dispatch(
      addNotification({
        type: 'success',
        message: 'Congratulations! Your order has been placed successfully.',
      })
    );

    // Redirect to orders page
    navigate('/orders');
  };

  if (cartItems.length === 0) {
    return null; // Let the useEffect redirect handle this
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/cart"
          className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Back to Cart"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">Secure Checkout</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Complete your order by entering shipping and billing details.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Columns: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Section */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-850 dark:bg-neutral-900/50 space-y-4">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Landmark size={20} className="text-brand-600 dark:text-brand-450" />
              <span>Shipping Address</span>
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register('fullName')}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  {...register('street')}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white"
                />
                {errors.street && (
                  <p className="mt-1 text-xs text-red-500">{errors.street.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  City
                </label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white"
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  {...register('state')}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white"
                />
                {errors.state && (
                  <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  ZIP / Postal Code
                </label>
                <input
                  type="text"
                  {...register('zipCode')}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white"
                  placeholder="e.g. 12345"
                />
                {errors.zipCode && (
                  <p className="mt-1 text-xs text-red-500">{errors.zipCode.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  {...register('country')}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white"
                />
                {errors.country && (
                  <p className="mt-1 text-xs text-red-500">{errors.country.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-850 dark:bg-neutral-900/50 space-y-4">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <CreditCard size={20} className="text-brand-600 dark:text-brand-450" />
              <span>Credit Card Information</span>
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  {...register('cardholderName')}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white"
                />
                {errors.cardholderName && (
                  <p className="mt-1 text-xs text-red-500">{errors.cardholderName.message}</p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  {...register('cardNumber')}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white"
                  placeholder="16-digit card number"
                  maxLength={16}
                />
                {errors.cardNumber && (
                  <p className="mt-1 text-xs text-red-500">{errors.cardNumber.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Expiration Date
                </label>
                <input
                  type="text"
                  {...register('expiryDate')}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white"
                  placeholder="MM/YY"
                  maxLength={5}
                />
                {errors.expiryDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.expiryDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  CVV
                </label>
                <input
                  type="password"
                  {...register('cvv')}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white"
                  placeholder="123"
                  maxLength={3}
                />
                {errors.cvv && (
                  <p className="mt-1 text-xs text-red-500">{errors.cvv.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary Details */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-850 dark:bg-neutral-900/50 space-y-4">
            <h3 className="font-extrabold text-neutral-900 dark:text-white text-base">Your Order</h3>

            {/* List of items */}
            <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 pr-1">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-12 w-12 shrink-0 rounded bg-white p-1 border border-neutral-100 dark:border-neutral-850 flex items-center justify-center">
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-xs text-neutral-900 line-clamp-1 dark:text-white">
                      {item.product.title}
                    </h5>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Qty: {item.quantity} × ${item.product.price.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white self-center">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-neutral-100 dark:border-neutral-850" />

            {/* Billing breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900 dark:text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Shipping</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {shipping === 0 ? <span className="text-green-600 font-bold">FREE</span> : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Sales Tax (8%)</span>
                <span className="font-semibold text-neutral-900 dark:text-white">${tax.toFixed(2)}</span>
              </div>
            </div>

            <hr className="border-neutral-100 dark:border-neutral-850" />

            <div className="flex items-center justify-between text-base font-black text-neutral-900 dark:text-white">
              <span>Total Amount</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>

            {/* Submit checkout button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-650 py-3 px-6 text-sm font-semibold text-white shadow-md hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700 transition-all"
            >
              <Landmark size={16} />
              <span>{isSubmitting ? 'Processing...' : 'Place Secure Order'}</span>
            </button>

            <div className="text-[10px] text-center text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1.5 pt-2">
              <Landmark size={12} className="text-green-600" />
              <span>SSL Secured & Encrypted transaction.</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
