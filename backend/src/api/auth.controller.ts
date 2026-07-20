import type { NextFunction, RequestHandler, Response } from 'express';
import type { User } from '@prisma/client';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { usersRepository } from '../entity/users.repository.js';
import { tokensRepository } from '../entity/tokens.repository.js';
import { mailer } from '../utils/mailer.js';
import { userService, type NormalizedUser } from '../services/user.service.js';
import { jwt } from '../utils/jwt.js';

async function sendAuthentication(res: Response, user: User) {
  const userData = userService.normalize(user);
  const accessToken = jwt.generateAccessToken(userData);
  const refreshToken = jwt.generateRefreshToken(userData);

  try {
    await tokensRepository.deleteByUserId(user.id);
  } catch {
    // no existing token, that's fine
  }

  await tokensRepository.create(user.id, refreshToken);

  res.cookie('refreshToken', refreshToken, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });

  res.send({
    user: userData,
    accessToken,
  });
}

const register: RequestHandler = async (req, res, next: NextFunction) => {
  try {
    const { email, username, password } = req.body;

    const errors = {
      email: userService.validateEmail(email),
      username: userService.validateUsername(username),
      password: userService.validatePassword(password),
    };

    if (Object.values(errors).some(error => error)) {
      res.status(400).json({ errors, message: 'Validation error' });
      return;
    }

    const [existingEmail, existingUsername] = await Promise.all([
      usersRepository.getByEmail(email),
      usersRepository.getByUsername(username),
    ]);

    if (existingEmail || existingUsername) {
      res.status(400).json({
        errors: {
          ...(existingEmail && { email: 'Email is already taken' }),
          ...(existingUsername && { username: 'Username is already taken' }),
        },
        message: 'Validation error',
      });
      return;
    }

    const activationToken = randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await usersRepository.create(
      email,
      username,
      hashedPassword,
      activationToken,
    );

    // Only surfaced to the client when delivery fails (e.g. this demo's
    // Resend sender isn't on a verified domain, so it can't email arbitrary
    // recipients) — lets the frontend offer an instant-activate fallback
    // instead of leaving the user stuck waiting on an email that won't come.
    let activationLink: string | undefined;

    try {
      await mailer.sendActivationLink(email, activationToken);
    } catch (mailErr) {
      console.error('Failed to send activation email:', mailErr);
      activationLink = `${process.env.CLIENT_URL}/activation/${email}/${activationToken}`;
      console.log(
        '\n--- ACTIVATION LINK (email failed, use this to activate) ---',
      );
      console.log(activationLink);
      console.log(
        '------------------------------------------------------------\n',
      );
    }

    res.json({ user: userService.normalize(user), activationLink });
  } catch (err) {
    next(err);
  }
};

const activate: RequestHandler = async (req, res, next: NextFunction) => {
  try {
    const email = req.params.email as string;
    const token = req.params.token as string;
    const user = await usersRepository.getByEmail(email);

    if (!user || user.activationToken !== token) {
      res.status(404).json({ message: 'Invalid activation link' });
      return;
    }

    const activatedUser = await usersRepository.activate(email);

    await sendAuthentication(res, activatedUser);
  } catch (err) {
    next(err);
  }
};

const login: RequestHandler = async (req, res, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const user = await usersRepository.getByEmail(email);
    const isPasswordValid = await bcrypt.compare(
      password,
      user?.password || '',
    );

    if (!user || !isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.activationToken !== null) {
      res.status(403).json({ message: 'Account is not activated' });
      return;
    }

    await sendAuthentication(res, user);
  } catch (err) {
    next(err);
  }
};

const refresh: RequestHandler = async (req, res, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken || '';
    const userData = jwt.validateRefreshToken(refreshToken) as NormalizedUser;
    const user = await usersRepository.getByEmail(userData?.email || '');
    const token = await tokensRepository.getByToken(refreshToken);

    if (!user || !userData || !token || token.userId !== user.id) {
      res.clearCookie('refreshToken');
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    await sendAuthentication(res, user);
  } catch (err) {
    next(err);
  }
};

const logout: RequestHandler = async (req, res, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken || '';
    const userData = jwt.validateRefreshToken(refreshToken) as NormalizedUser;

    if (userData) {
      try {
        await tokensRepository.deleteByUserId(userData.id);
      } catch {
        // token already gone, that's fine
      }
    }

    res.clearCookie('refreshToken');
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export const authController: Record<string, RequestHandler> = {
  register,
  activate,
  login,
  refresh,
  logout,
};
