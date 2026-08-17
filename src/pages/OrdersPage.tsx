/**
 * @file src/pages/OrdersPage.tsx
 * @description Customer order history list page.
 *
 * @why-it-exists
 * Lists previous purchases and delivery statuses for customer reference.
 */

import { useEffect } from 'react';
import { Link } from 'react-router';
import { useAppSelector } from '@/store/hooks';
import { Calendar, Package, ArrowLeft, CheckCircle2, AlertCircle, Truck, Clock } from 'lucide-react';
import type { OrderStatus } from '@/features/orders/types/orderTypes';

export default function OrdersPage() {
  const orders = useAppSelector((state) => state.orders.orders);

  // Set page meta title for SEO
  useEffect(() => {
    document.title = 'Order History | E-SHOP';
  }, []);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle2 size={12} />
            <span>Delivered</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
            <Truck size={12} />
            <span>Shipped</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            <Clock size={12} />
            <span>Processing</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-2.5 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-850 dark:text-neutral-400">
            <AlertCircle size={12} />
            <span>Pending</span>
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">Order History</h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            View and track your previous purchases.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-white py-16 px-4 text-center dark:border-neutral-800/80 dark:bg-neutral-900/40">
          <div className="rounded-full bg-neutral-50 p-4 text-neutral-400 dark:bg-neutral-850">
            <Package size={32} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-neutral-900 dark:text-white">No Orders Placed</h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
            You haven't made any purchases yet. Start shopping to fill your order history.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-650 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            <ArrowLeft size={16} />
            <span>Start Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">Order History</h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          You have placed {orders.length} order{orders.length > 1 ? 's' : ''}.
        </p>
      </div>

      {/* Orders List Grid */}
      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-855 dark:bg-neutral-900/50 overflow-hidden"
          >
            {/* Header Block of Order Card */}
            <div className="bg-neutral-50 px-5 py-4 border-b border-neutral-100 dark:bg-neutral-850 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                <div>
                  <span className="text-neutral-400 block uppercase font-bold tracking-wider text-[10px]">
                    Order Number
                  </span>
                  <span className="font-extrabold text-neutral-900 dark:text-white text-sm">
                    {order.id}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block uppercase font-bold tracking-wider text-[10px] flex items-center gap-1">
                    <Calendar size={10} /> Placed On
                  </span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {formatDate(order.date)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block uppercase font-bold tracking-wider text-[10px]">
                    Total Amount
                  </span>
                  <span className="font-extrabold text-brand-650 dark:text-brand-400">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
              <div>{getStatusBadge(order.status)}</div>
            </div>

            {/* Body of Order Card */}
            <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Items Column */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Items Purchased</h4>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {order.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-white p-1 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center">
                          <img
                            src={item.productImage}
                            alt={item.productTitle}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-semibold text-xs text-neutral-900 line-clamp-1 dark:text-white hover:text-brand-650">
                            <Link to={`/products/${item.productId}`}>{item.productTitle}</Link>
                          </h5>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Details Column */}
              <div className="lg:border-l lg:border-neutral-100 dark:lg:border-neutral-800 lg:pl-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Shipping Details
                  </h4>
                  <div className="text-xs text-neutral-600 dark:text-neutral-450 space-y-1">
                    <p className="font-bold text-neutral-850 dark:text-neutral-200">
                      {order.shippingAddress.fullName}
                    </p>
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Payment Method
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-450">
                    {order.paymentMethod}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
