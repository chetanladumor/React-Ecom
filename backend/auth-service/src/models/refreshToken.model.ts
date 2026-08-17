/**
 * @file backend/auth-service/src/models/refreshToken.model.ts
 * 
 * @why-file-exists
 * Tracks active customer sessions using refresh tokens to enable secure session rotations 
 * and support immediate token revocation (logout/hijack detection).
 * 
 * @why-pattern-selected
 * Database-backed token session storage with MongoDB TTL (Time-To-Live) indexing.
 * 
 * @alternative-approaches
 * - Storing sessions in memory: Bad. Sessions are lost when the auth server restarts.
 * - Storing sessions in Redis: Highly performant and recommended. We use MongoDB here with a TTL 
 *   index to simplify persistent storage for this phase, which allows querying active sessions per user easily.
 * 
 * @performance-impact
 * Negligible. A background process in MongoDB periodically sweeps the collection to delete expired documents.
 * 
 * @scaling-considerations
 * Indexing on token lookup `{ token: 1 }` prevents collection scans during session refreshes.
 */

import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Number,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // Standard Mongoose way to declare a TTL index on a Date field.
      // Automatically deletes documents after the specified date has passed.
      expires: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
