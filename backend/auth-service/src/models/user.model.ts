/**
 * @file backend/auth-service/src/models/user.model.ts
 * 
 * @why-file-exists
 * Represents the persistent schema definition and interface constraints for User documents in MongoDB.
 * 
 * @why-pattern-selected
 * Active Record / Document Mapper pattern via Mongoose. Integrates schema validations, lifecycle hooks 
 * (pre-save hooks for password hashing), and instance helper methods directly into the data model object.
 * 
 * @alternative-approaches
 * - Row-Data Gateway / Raw Driver Querying: Requires writing manual hashing checks on every update/create route, 
 *   greatly increasing the chance of storing passwords in plain text.
 * 
 * @performance-impact
 * Bcrypt hashing uses adaptive CPU resource allocations. The workload factor (salt rounds) is set to 10 to balance 
 * high cryptographic security with fast response latency.
 * 
 * @scaling-considerations
 * Contains unique index fields (`email`, `username`) to ensure consistency. To scale out writes in high-register environments, 
 * the collection sharding key should be defined on `{ username: 1 }` or `{ _id: "hashed" }`.
 */

import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: number;
  username: string;
  email: string;
  passwordHash: string;
  name: {
    firstname: string;
    lastname: string;
  };
  phone: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    _id: {
      type: Number,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      firstname: { type: String, required: true, trim: true },
      lastname: { type: String, required: true, trim: true },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: Hash password using bcrypt before committing the document to MongoDB.
 */
userSchema.pre('save', async function (next) {
  const user = this as IUser;

  // Only hash password if it was modified or is new
  if (!user.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Helper instance method to verify if a raw input password matches the stored bcrypt hash.
 */
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUser>('User', userSchema);
