import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from './prisma';
import { LoginInput, RegisterAthleteInput } from '../validation/schemas';
import { UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import { JwtPayload } from '../middleware/auth';

// ============================================
// AUTH SERVICE
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  /**
   * Login user and return JWT token
   */
  async login(input: LoginInput): Promise<{ token: string; user: Omit<JwtPayload, 'iat' | 'exp'> }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.active) {
      throw new UnauthorizedError('Account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    return {
      token,
      user: payload,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    return user;
  }

  /**
   * Register athlete account
   * Requires athlete to exist with an email
   * Creates User account linked to Athlete
   */
  async registerAthlete(input: RegisterAthleteInput): Promise<{ token: string; user: Omit<JwtPayload, 'iat' | 'exp'> }> {
    // Find athlete by ID
    const athlete = await prisma.athlete.findUnique({
      where: { id: input.athleteId },
    });

    if (!athlete) {
      throw new NotFoundError('Athlete not found');
    }

    if (athlete.userId) {
      throw new ConflictError('This athlete already has an account registered');
    }

    // Determinar email: usar el del atleta si existe, o el enviado en el formulario
    const emailToUse = athlete.email || input.email;
    if (!emailToUse) {
      throw new UnauthorizedError('Email required. Provide your email to register.');
    }

    // Check if user already exists with this email (just in case)
    const existingUser = await prisma.user.findUnique({
      where: { email: emailToUse },
    });

    if (existingUser) {
      throw new ConflictError('Email already in use');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user and link to athlete (transaction)
    const user = await prisma.user.create({
      data: {
        email: emailToUse,
        passwordHash,
        role: 'PUBLIC',
        active: true,
      },
    });

    // Link user to athlete — also save email if it wasn't set
    await prisma.athlete.update({
      where: { id: athlete.id },
      data: {
        userId: user.id,
        ...(athlete.email ? {} : { email: emailToUse }),
      },
    });
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    return {
      token,
      user: payload,
    };
  }
}

export const authService = new AuthService();
