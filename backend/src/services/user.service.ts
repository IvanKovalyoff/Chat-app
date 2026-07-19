import type { User } from '@prisma/client';

export type NormalizedUser = {
  id: string;
  email: string;
  username: string;
};

function normalize({ id, email, username }: User): NormalizedUser {
  return { id, email, username };
}

function validateEmail(email: string) {
  const emailPattern = /^[\w.+-]+@([\w-]+\.){1,3}[\w-]{2,}$/;

  if (!email) return 'Email is required';
  if (!emailPattern.test(email)) return 'Email is not valid';
}

function validateUsername(username: string) {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'At least 3 characters';
  if (username.length > 20) return 'At most 20 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return 'Only letters, numbers and underscores';
}

function validatePassword(password: string) {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'At least 6 characters';
}

export const userService = {
  normalize,
  validateEmail,
  validateUsername,
  validatePassword,
};
