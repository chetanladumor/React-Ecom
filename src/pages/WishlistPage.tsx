/**
 * @file src/pages/WishlistPage.tsx
 * @description Customer saved items page.
 *
 * @why-it-exists
 * Displays lists of items saved by the customer for future checkout consideration.
 *
 * @react-commentaries
 * - Why lazy loading is used: Reduces initial load package size.
 * - Why state belongs in Redux: Wishlist state must synchronize across product cards, product details, and headers.
 */

import { useEffect } from 'react';
import { Link } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeFromWishlist } from '@/features/wishlist/slice/wishlistSlice';
import { addToCart } from '@/features/cart/slice/cartSlice';
import { addNotification } from '@/store/slices/notificationSlice';
import { Heart, Trash2, ShoppingCart, ArrowLeft, Star } from 'lucide-react';
import type { Product } from '@/features/products/types/productTypes';

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  // Set page meta title for SEO
  useEffect(() => {
    document.title = 'My Wishlist | E-SHOP';
  }, []);

  const handleRemove = (id: number, title: string) => {
    dispatch(removeFromWishlist(id));
    dispatch(
      addNotification({
        type: 'info',
        message: `"${title}" removed from your wishlist.`,
      })
    );
  };

  const handleMoveToCart = (product: Product) => {
    dispatch(addToCart({ product, quantity: 1 }));
    dispatch(removeFromWishlist(product.id));
    dispatch(
      addNotification({
        type: 'success',
        message: `"${product.title}" moved to your shopping cart.`,
      })
    );
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">My Wishlist</h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            View and manage items saved to your wishlist.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-white py-16 px-4 text-center dark:border-neutral-800/80 dark:bg-neutral-900/40">
          <div className="rounded-full bg-neutral-50 p-4 text-neutral-400 dark:bg-neutral-850">
            <Heart size={32} className="text-neutral-400" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-neutral-900 dark:text-white">Your Wishlist is Empty</h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
            You haven't saved any products to your wishlist yet. Keep browsing to find products you love.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-650 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            <ArrowLeft size={16} />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">My Wishlist</h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Your collection of saved products. You can move items directly to your shopping cart.
        </p>
      </div>

      {/* Grid of Wishlist Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {wishlistItems.map((product) => {
          const { id, title, price, image, rating, category } = product;
          return (
            <div
              key={id}
              className="group flex flex-col rounded-2xl border border-neutral-100 bg-white p-4 transition-all duration-300 hover:border-neutral-200 hover:shadow-lg dark:border-neutral-800/80 dark:bg-neutral-900/40 dark:hover:border-neutral-700"
            >
              {/* Product Image Frame */}
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white p-6 flex items-center justify-center border border-neutral-50 dark:border-neutral-800">
                <img
                  src={image}
                  alt={title}
                  className="h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <button
                  onClick={() => handleRemove(id, title)}
                  className="absolute top-2 right-2 rounded-full border border-neutral-100 bg-white p-2 text-neutral-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-500 dark:border-neutral-850 dark:bg-neutral-900 dark:hover:bg-red-950/20"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Product Content Block */}
              <div className="mt-4 flex flex-1 flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-xs">
                    <span className="font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-450">
                      {category}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <span className="font-semibold text-neutral-850 dark:text-neutral-200">
                        {rating.rate}
                      </span>
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                    </div>
                  </div>
                  <h3 className="font-bold text-neutral-900 line-clamp-2 dark:text-white group-hover:text-brand-650 dark:group-hover:text-brand-400 transition-colors text-sm">
                    <Link to={`/products/${id}`}>{title}</Link>
                  </h3>
                </div>

                <div className="mt-4 space-y-3">
                  <span className="text-lg font-black text-neutral-950 dark:text-white block">
                    ${price.toFixed(2)}
                  </span>
                  {/* Action buttons */}
                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-50 py-2.5 px-4 text-xs font-semibold text-brand-700 hover:bg-brand-650 hover:text-white transition-all dark:bg-brand-950/40 dark:text-brand-400 dark:hover:bg-brand-600 dark:hover:text-white"
                  >
                    <ShoppingCart size={14} />
                    <span>Move to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
