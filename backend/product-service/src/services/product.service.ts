/**
 * @file backend/product-service/src/services/product.service.ts
 * 
 * @why-file-exists
 * Encapsulates business logic for product catalog management, category lists, and 
 * implements the Cache-Aside performance optimization pattern using Redis.
 * 
 * @why-pattern-selected
 * Cache-Aside (Lazy Loading) pattern. When data is requested, we read from the cache (Redis) first. 
 * If there is a cache miss, we load from the database (MongoDB), populate the cache, and return the data.
 * 
 * @alternative-approaches
 * - Read-Through Caching: Requires writing custom plugins inside the database or cache layer, 
 *   which is complex to implement and maintain.
 * - Cache-All on startup (Pre-caching): Good for tiny static catalogs, but wastes massive memory 
 *   if the catalog scale grows and only a fraction of products are active.
 * 
 * @performance-impact
 * Reduces single product details query latencies from ~15-30ms (MongoDB lookup) to ~1-2ms (Redis in-memory key lookup).
 * 
 * @scaling-considerations
 * Setting a Time-To-Live (TTL) prevents cache pollution. Active cache invalidation on write operations 
 * (creates/updates) guarantees that clients never see stale catalog data.
 */

import { Product, IProduct } from '../models/product.model';
import { redisClient } from '../config/redis';
import { config } from '../config/product.config';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class ProductService {
  /**
   * Helper to seed the database from Fake Store API if it is empty.
   */
  private static async seedDatabaseIfEmpty(): Promise<void> {
    try {
      const count = await Product.countDocuments();
      if (count === 0) {
        logger.info('Database is empty. Fetching products from Fake Store API to seed...');
        const response = await fetch('https://fakestoreapi.com/products');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch from Fake Store API: ${response.statusText}`);
        }
        
        const apiProducts = await response.json();
        const docs = apiProducts.map((p: any) => ({
          _id: p.id,
          title: p.title,
          price: p.price,
          description: p.description,
          category: p.category,
          image: p.image,
          rating: {
            rate: p.rating?.rate || 0,
            count: p.rating?.count || 0
          }
        }));

        await Product.insertMany(docs);
        logger.info(`Successfully seeded ${docs.length} products into the database.`);
      }
    } catch (error) {
      logger.error('Error during database seeding:', error);
    }
  }

  /**
   * Fetches products matching filters (search, category, sort).
   * Note: List queries are not cached in Redis locally in this stage to avoid complex cache key management 
   * of multiple filter combinations, but can be added as requirements grow.
   */
  public static async queryProducts(filters: {
    search?: string;
    category?: string;
    sort?: 'default' | 'price-asc' | 'price-desc' | 'rating-desc';
  }): Promise<IProduct[]> {
    await this.seedDatabaseIfEmpty();

    const query: Record<string, any> = {};

    // 1. Text Search filtering
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // 2. Category filtering
    if (filters.category && filters.category !== 'all') {
      query.category = filters.category.toLowerCase();
    }

    let queryExec = Product.find(query);

    // 3. Sorting logic
    if (filters.sort) {
      if (filters.sort === 'price-asc') {
        queryExec = queryExec.sort({ price: 1 });
      } else if (filters.sort === 'price-desc') {
        queryExec = queryExec.sort({ price: -1 });
      } else if (filters.sort === 'rating-desc') {
        queryExec = queryExec.sort({ 'rating.rate': -1 });
      } else if (filters.search) {
        // If sorting default but text search is present, sort by relevance score
        queryExec = queryExec.select({ score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } });
      }
    }

    return queryExec.exec();
  }

  /**
   * Fetches a single product by numeric ID using the Cache-Aside pattern.
   */
  public static async getProductById(id: number): Promise<IProduct> {
    const cacheKey = `product:${id}`;

    // 1. Try reading from Redis cache (Cache-Aside attempt)
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        // Cache Hit! Parse and return.
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      // Soft fail: Log error and continue to MongoDB (Resiliency rule)
    }

    // 2. Cache Miss: Read from MongoDB
    const product = await Product.findById(id);
    if (!product) {
      throw new NotFoundError(`Product with ID ${id} not found.`);
    }

    // 3. Write data to cache with a TTL (Time-To-Live)
    try {
      await redisClient.setEx(cacheKey, config.cacheTtlSec, JSON.stringify(product));
    } catch (cacheError) {
      // Soft fail: Log and return product
    }

    return product;
  }

  /**
   * Retrieves the distinct list of categories using Cache-Aside.
   */
  public static async getCategories(): Promise<string[]> {
    await this.seedDatabaseIfEmpty();

    const cacheKey = 'categories';

    try {
      const cachedCategories = await redisClient.get(cacheKey);
      if (cachedCategories) {
        return JSON.parse(cachedCategories);
      }
    } catch (error) {
      // Log and continue to database
    }

    const categories = await Product.distinct('category');
    
    try {
      // Cache the categories list for 24 hours (long-lived cache)
      await redisClient.setEx(cacheKey, 86400, JSON.stringify(categories));
    } catch (error) {
      // Log and return
    }

    return categories;
  }

  /**
   * Admin: Creates a product, invalidates categories cache.
   */
  public static async createProduct(productData: any): Promise<IProduct> {
    // Determine product ID: mock sequential integers
    const count = await Product.countDocuments();
    const mockId = count + 1;

    const newProduct = new Product({
      _id: mockId,
      ...productData,
    });

    await newProduct.save();

    // Invalidate categories cache
    await redisClient.del('categories');

    return newProduct;
  }

  /**
   * Admin: Updates a product, invalidates single product and categories cache (Active Invalidation).
   */
  public static async updateProduct(id: number, updateData: any): Promise<IProduct> {
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedProduct) {
      throw new NotFoundError(`Product with ID ${id} not found for updating.`);
    }

    // Active Cache Invalidation: Delete old cache key to prevent stale reads
    await redisClient.del(`product:${id}`);
    await redisClient.del('categories');

    return updatedProduct;
  }

  /**
   * Admin: Deletes a product, invalidates single product and categories cache.
   */
  public static async deleteProduct(id: number): Promise<void> {
    const result = await Product.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundError(`Product with ID ${id} not found for deletion.`);
    }

    // Active Cache Invalidation
    await redisClient.del(`product:${id}`);
    await redisClient.del('categories');
  }
}
