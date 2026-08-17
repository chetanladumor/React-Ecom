/**
 * @file src/features/products/components/ProductCard.tsx
 * @description Product catalog card component supporting grid and list layouts.
 *
 * @why-it-exists
 * Renders individual product cells within the catalog list. Houses quick actions 
 * like Add to Cart / Wishlist and links to the full inspection view.
 *
 * @enterprise-considerations
 * - Design excellence: Dynamic star ratings, layout adaptations, hover scaling, 
 *   and responsive image framing.
 */

import { Link } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addNotification } from '@/store/slices/notificationSlice';
import { addToCart } from '@/features/cart/slice/cartSlice';
import { toggleWishlist } from '@/features/wishlist/slice/wishlistSlice';
import type { Product } from '../types/productTypes';
import { Star, ShoppingCart, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const { id, title, price, description, category, image, rating } = product;

  // Read wishlist state to toggle heart icon color
  const isInWishlist = useAppSelector((state) =>
    state.wishlist.items.some((item) => item.id === id)
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ product, quantity: 1 }));
    dispatch(
      addNotification({
        type: 'success',
        message: `"${title}" has been added to your cart.`,
      })
    );
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist(product));
    dispatch(
      addNotification({
        type: 'info',
        message: isInWishlist
          ? `"${title}" has been removed from your wishlist.`
          : `"${title}" has been saved to your wishlist.`,
      })
    );
  };

  // Helper to render partial rating stars
  const renderStars = (rate: number) => {
    const stars = [];
    const fullStars = Math.floor(rate);
    const hasHalfStar = rate % 1 >= 0.4; // 0.4 or higher rounds to half star visually

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={14} className="fill-amber-400 text-amber-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative inline-block">
            <Star size={14} className="text-neutral-200 dark:text-neutral-700" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star size={14} className="fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} size={14} className="text-neutral-200 dark:text-neutral-700" />);
      }
    }
    return stars;
  };

  if (viewMode === 'list') {
    return (
      <Link
        to={`/products/${id}`}
        className="group flex flex-col gap-6 rounded-2xl border border-neutral-100 bg-white p-5 transition-all duration-300 hover:border-neutral-200 hover:shadow-lg dark:border-neutral-800/80 dark:bg-neutral-900/40 dark:hover:border-neutral-700 sm:flex-row"
      >
        {/* Product Image Frame */}
        <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-xl bg-white p-4 sm:w-44 flex items-center justify-center border border-neutral-50 dark:border-neutral-800">
          <img
            src={image}
            alt={title}
            className="h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Product Content Block */}
        <div className="flex flex-1 flex-col justify-between py-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-950/30 dark:text-brand-400">
                {category}
              </span>
              <div className="flex items-center gap-1">
                <div className="flex">{renderStars(rating.rate)}</div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">({rating.count})</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 line-clamp-1 dark:text-white group-hover:text-brand-650 dark:group-hover:text-brand-400 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-neutral-500 line-clamp-2 dark:text-neutral-400">
              {description}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-2xl font-black text-neutral-950 dark:text-white">
              ${price.toFixed(2)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleAddToWishlist}
                className="rounded-xl border border-neutral-200 p-2.5 text-neutral-500 transition-all hover:bg-neutral-50 hover:text-red-500 dark:border-neutral-850 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-red-400"
                aria-label="Add to wishlist"
              >
                <Heart size={18} className={isInWishlist ? 'fill-red-500 text-red-500' : ''} />
              </button>
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 rounded-xl bg-brand-650 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
              >
                <ShoppingCart size={16} />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/products/${id}`}
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
          onClick={handleAddToWishlist}
          className="absolute top-2 right-2 rounded-full border border-neutral-100 bg-white p-2 shadow-sm transition-all hover:text-red-500 dark:border-neutral-850 dark:bg-neutral-900 dark:hover:text-red-400"
          aria-label="Add to wishlist"
        >
          <Heart size={16} className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-neutral-400'} />
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
              <span className="font-semibold text-neutral-850 dark:text-neutral-200">{rating.rate}</span>
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-neutral-400 dark:text-neutral-500">({rating.count})</span>
            </div>
          </div>
          <h3 className="font-bold text-neutral-900 line-clamp-2 dark:text-white group-hover:text-brand-650 dark:group-hover:text-brand-400 transition-colors text-sm">
            {title}
          </h3>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-lg font-black text-neutral-950 dark:text-white">
            ${price.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            className="rounded-xl bg-brand-50 p-2 text-brand-700 transition-all hover:bg-brand-650 hover:text-white dark:bg-brand-950/40 dark:text-brand-400 dark:hover:bg-brand-600 dark:hover:text-white"
            aria-label="Add to cart"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
}
