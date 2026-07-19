import jsonwebtoken from 'jsonwebtoken';
import type { NormalizedUser } from '../services/user.service.js';

const SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '10m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

function generateAccessToken(user: NormalizedUser) {
  return jsonwebtoken.sign(user, SECRET, {
    expiresIn: ACCESS_EXPIRES_IN as jsonwebtoken.SignOptions['expiresIn'],
  });
}
function generateRefreshToken(user: NormalizedUser) {
  return jsonwebtoken.sign(user, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN as jsonwebtoken.SignOptions['expiresIn'],
  });
}

function validateAccessToken(token: string) {
  try {
    return jsonwebtoken.verify(token, SECRET);
  } catch {
    return null;
  }
}

function validateRefreshToken(token: string) {
  try {
    return jsonwebtoken.verify(token, REFRESH_SECRET);
  } catch {
    return null;
  }
}

export const jwt = {
  generateAccessToken,
  generateRefreshToken,
  validateAccessToken,
  validateRefreshToken,
};
