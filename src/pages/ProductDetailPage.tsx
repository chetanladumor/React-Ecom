/**
 * @file src/pages/ProductDetailPage.tsx
 * @description Product Details page wrapper.
 *
 * @why-it-exists
 * Handles single product inspections. Integrates route parameters with detail 
 * queries, loading states, and cart addition controls.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useGetProductByIdQuery } from '@/features/products/services/productsApi';
import { addNotification } from '@/store/slices/notificationSlice';
import { addToCart } from '@/features/cart/slice/cartSlice';
import { toggleWishlist } from '@/features/wishlist/slice/wishlistSlice';
import { Star, ShoppingCart, Heart, ArrowLeft, Plus, Minus, Shield, Truck, RefreshCw } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const [quantity, setQuantity] = useState(1);

  // Fetch product data by ID
  const { data: product, isLoading, isError } = useGetProductByIdQuery(id || '');

  // Select wishlist status to toggle heart icon highlight
  const isInWishlist = useAppSelector((state) =>
    state.wishlist.items.some((item) => item.id === product?.id)
  );

  // Set page meta title dynamically for SEO
  useEffect(() => {
    if (product) {
      document.title = `${product.title} | E-SHOP`;
    } else {
      document.title = 'Product Details | E-SHOP';
    }
  }, [product]);

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addToCart({ product, quantity }));
    dispatch(
      addNotification({
        type: 'success',
        message: `${quantity}x "${product.title}" added to your cart.`,
      })
    );
  };

  const handleAddToWishlist = () => {
    if (!product) return;
    dispatch(toggleWishlist(product));
    dispatch(
      addNotification({
        type: 'info',
        message: isInWishlist
          ? `"${product.title}" has been removed from your wishlist.`
          : `"${product.title}" has been saved to your wishlist.`,
      })
    );
  };

  // Helper to render rating stars
  const renderStars = (rate: number) => {
    const stars = [];
    const fullStars = Math.floor(rate);
    const hasHalfStar = rate % 1 >= 0.4;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={16} className="fill-amber-400 text-amber-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative inline-block">
            <Star size={16} className="text-neutral-200 dark:text-neutral-700" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star size={16} className="fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} size={16} className="text-neutral-200 dark:text-neutral-700" />);
      }
    }
    return stars;
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError || !product) {
    return (
      <div className="space-y-6">
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Catalog
        </Link>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-white py-16 px-4 text-center dark:border-neutral-800/80 dark:bg-neutral-900/40">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Product Not Found</h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            The product you are trying to view does not exist or an error occurred.
          </p>
          <Link
            to="/products"
            className="mt-6 rounded-xl bg-brand-650 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const { title, price, description, category, image, rating } = product;

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left Column: Product Image Frame */}
        <div className="flex items-center justify-center rounded-2xl border border-neutral-100 bg-white p-8 shadow-sm dark:border-neutral-850 dark:bg-neutral-900/50">
          <img
            src={image}
            alt={title}
            className="max-h-[400px] object-contain transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* Right Column: Details Info Card */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950/40 dark:text-brand-400">
              {category}
            </span>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white leading-tight">
              {title}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2">
              <div className="flex">{renderStars(rating.rate)}</div>
              <span className="text-sm font-bold text-neutral-850 dark:text-neutral-200">
                {rating.rate.toFixed(1)}
              </span>
              <span className="text-sm text-neutral-400 dark:text-neutral-500">
                ({rating.count} reviews)
              </span>
            </div>

            {/* Price Tag */}
            <div className="text-3xl font-black text-neutral-950 dark:text-white">
              ${price.toFixed(2)}
            </div>

            <hr className="border-neutral-100 dark:border-neutral-850" />

            {/* Product Description */}
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm">
              {description}
            </p>
          </div>

          <div className="space-y-6">
            <hr className="border-neutral-100 dark:border-neutral-850" />

            {/* Stepper + Quick Cart/Wishlist Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Quantity Stepper */}
              <div className="flex items-center rounded-xl border border-neutral-200 p-1 dark:border-neutral-700 dark:bg-neutral-850">
                <button
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="rounded-lg p-2 text-neutral-500 transition-all hover:bg-neutral-100 hover:text-neutral-850 disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center text-sm font-bold text-neutral-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="rounded-lg p-2 text-neutral-500 transition-all hover:bg-neutral-100 hover:text-neutral-850 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-650 py-3 px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700 min-w-[160px]"
              >
                <ShoppingCart size={18} />
                <span>Add to Cart</span>
              </button>

              {/* Add to Wishlist button */}
              <button
                onClick={handleAddToWishlist}
                className="rounded-xl border border-neutral-200 p-3 text-neutral-500 transition-all hover:bg-neutral-50 hover:text-red-500 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-red-400"
                aria-label="Save to wishlist"
              >
                <Heart size={18} className={isInWishlist ? 'fill-red-500 text-red-500' : ''} />
              </button>
            </div>

            {/* Quality Assurance Badges */}
            <div className="grid grid-cols-3 gap-2 border-t border-neutral-100 pt-5 text-center text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-850 dark:text-neutral-400">
              <div className="flex flex-col items-center gap-1.5">
                <Truck size={18} className="text-brand-600 dark:text-brand-450" />
                <span>Free Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <RefreshCw size={18} className="text-brand-600 dark:text-brand-450" />
                <span>30-Day Return</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Shield size={18} className="text-brand-600 dark:text-brand-450" />
                <span>Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page Detail Loading Skeleton
function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-5 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="aspect-square w-full rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="flex flex-col justify-between py-2">
          <div className="space-y-4">
            <div className="h-6 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-10 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-5 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-8 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="space-y-2 pt-2">
              <div className="h-4.5 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4.5 w-5/6 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4.5 w-4/5 rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </div>
          <div className="space-y-4 pt-6">
            <div className="h-12 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-10 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
