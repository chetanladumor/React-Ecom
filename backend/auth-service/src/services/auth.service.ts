/**
 * @file backend/auth-service/src/services/auth.service.ts
 * 
 * @why-file-exists
 * Encapsulates the core business services of the Auth Service (registrations, verifications, token generations).
 * 
 * @why-pattern-selected
 * Domain Service layer pattern. Decouples controllers from direct DB operations and isolates transaction rules.
 * 
 * @alternative-approaches
 * - Writing DB queries and token generation directly inside Express route handlers: Anti-pattern. 
 *   Makes components un-testable, bloated, and highly coupled to the Express framework.
 * 
 * @performance-impact
 * Utilizes cryptographically secure random bytes for session tokens. Restricts Database calls 
 * by querying single indexes (`email`, `username`, `token`).
 * 
 * @scaling-considerations
 * Access tokens are completely stateless (self-contained JWTs). Downstream microservices can verify 
 * them cryptographically in-memory without contacting the Auth Service or MongoDB on every request.
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user.model';
import { RefreshToken } from '../models/refreshToken.model';
import { config } from '../config/auth.config';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { publishEvent } from '../events/publisher';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: {
    id: number;
    username: string;
    email: string;
    name: {
      firstname: string;
      lastname: string;
    };
    role: string;
  };
}

export class AuthService {
  /**
   * Registers a new user account, hashes password, and publishes registration event.
   */
  public static async registerUser(data: {
    email: string;
    username: string;
    passwordHash: string; // Raw password from request, to be hashed in pre-save hook
    firstname: string;
    lastname: string;
    phone: string;
  }) {
    // 1. Check for email collision
    const existingEmail = await User.findOne({ email: data.email });
    if (existingEmail) {
      throw new ConflictError('A user with this email address already exists.');
    }

    // 2. Check for username collision
    const existingUsername = await User.findOne({ username: data.username });
    if (existingUsername) {
      throw new ConflictError('A user with this username already exists.');
    }

    // 3. Create user record. The pre-save hook in user.model will hash passwordHash automatically.
    // We mock sequential integer IDs by counting current users, aligning with fake store ids
    const userCount = await User.countDocuments();
    const mockId = userCount + 100; // Offset local registered users to avoid collisions with fake store user IDs 1-10

    const newUser = new User({
      _id: mockId,
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      name: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      phone: data.phone,
      role: 'user', // Default signup is customer role
    });

    await newUser.save();

    // 4. Publish async user registration event for downstream integrations
    await publishEvent('user.registered', {
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      name: newUser.name,
    });

    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };
  }

  /**
   * Authenticates user credentials and generates access/refresh tokens.
   */
  public static async loginUser(credentials: { username: string; password: string }): Promise<AuthResult> {
    const user = await User.findOne({ username: credentials.username });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials. Please verify username and password.');
    }

    const isMatch = await user.comparePassword(credentials.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials. Please verify username and password.');
    }

    // Generate token set
    const tokens = await this.generateTokenSet(user);

    return {
      user: {
        id: user._id as number,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Refreshes access token and rotates the refresh token.
   */
  public static async rotateRefreshToken(oldToken: string): Promise<AuthTokens> {
    const tokenDoc = await RefreshToken.findOne({ token: oldToken });
    if (!tokenDoc) {
      throw new UnauthorizedError('Session expired or invalid refresh token.');
    }

    // Verify token expiration
    if (tokenDoc.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      throw new UnauthorizedError('Refresh token expired. Please log in again.');
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      throw new UnauthorizedError('User account associated with this session no longer exists.');
    }

    // Generate new set
    const tokens = await this.generateTokenSet(user);

    // Delete old refresh token (rotates token)
    await RefreshToken.deleteOne({ _id: tokenDoc._id });

    return tokens;
  }

  /**
   * Revokes refresh token (logout).
   */
  public static async revokeRefreshToken(token: string): Promise<void> {
    await RefreshToken.deleteOne({ token });
  }

  /**
   * Helper to generate Access token and create/store a cryptographically secure Refresh token.
   */
  private static async generateTokenSet(user: IUser): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiry as any }
    );

    // Generate secure random string for refresh token
    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.refreshTokenExpiryDays);

    const refreshTokenDoc = new RefreshToken({
      userId: user._id,
      token: refreshTokenString,
      expiresAt,
    });

    await refreshTokenDoc.save();

    return {
      accessToken,
      refreshToken: refreshTokenString,
    };
  }
}
