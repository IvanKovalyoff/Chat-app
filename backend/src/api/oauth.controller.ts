import { randomBytes } from 'crypto';
import type { NextFunction, RequestHandler, Response } from 'express';
import { usersRepository } from '../entity/users.repository.js';
import { tokensRepository } from '../entity/tokens.repository.js';
import { userService } from '../services/user.service.js';
import { jwt } from '../utils/jwt.js';

async function generateUsername(name: string, email: string): Promise<string> {
  const base =
    (name || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 15) || 'user';

  if (!(await usersRepository.getByUsername(base))) return base;

  for (let i = 0; i < 5; i++) {
    const candidate = `${base}_${Math.floor(Math.random() * 9999)}`.slice(
      0,
      20,
    );
    if (!(await usersRepository.getByUsername(candidate))) return candidate;
  }

  return `user_${randomBytes(4).toString('hex')}`;
}

async function finishOAuthLogin(
  googleId: string,
  email: string,
  name: string,
  res: Response,
) {
  let user = await usersRepository.findByGoogleId(googleId);

  if (!user) {
    const byEmail = await usersRepository.getByEmail(email);
    if (byEmail) {
      user = await usersRepository.linkOAuth(byEmail.id, googleId);
    } else {
      const username = await generateUsername(name, email);
      user = await usersRepository.createOAuthUser(email, username, googleId);
    }
  }

  const userData = userService.normalize(user);
  const accessToken = jwt.generateAccessToken(userData);
  const refreshToken = jwt.generateRefreshToken(userData);

  try {
    await tokensRepository.deleteByUserId(user.id);
  } catch {
    // no existing token, that's fine
  }

  await tokensRepository.create(user.id, refreshToken);

  const params = new URLSearchParams({
    accessToken,
    userId: userData.id,
    email: userData.email,
    username: userData.username,
  });

  res.redirect(`${process.env.CLIENT_URL}/oauth/callback?${params}`);
}

export const googleRedirect: RequestHandler = (_req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.SERVER_URL}/auth/google/callback`,
    response_type: 'code',
    scope: 'email profile',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

export const googleCallback: RequestHandler = async (
  req,
  res,
  next: NextFunction,
) => {
  try {
    const { code } = req.query;

    if (!code) {
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
      return;
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.SERVER_URL}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const { access_token } = (await tokenRes.json()) as {
      access_token: string;
    };

    const profileRes = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const profile = (await profileRes.json()) as {
      sub: string;
      email: string;
      name: string;
    };

    await finishOAuthLogin(profile.sub, profile.email, profile.name, res);
  } catch (err) {
    next(err);
  }
};
