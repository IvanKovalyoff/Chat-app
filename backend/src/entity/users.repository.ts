import { db } from '../utils/db.js';

function getByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

function getByUsername(username: string) {
  return db.user.findUnique({ where: { username } });
}

function findByGoogleId(googleId: string) {
  return db.user.findUnique({ where: { googleId } });
}

function create(
  email: string,
  username: string,
  password: string,
  activationToken?: string,
) {
  return db.user.create({
    data: { email, username, password, activationToken },
  });
}

function createOAuthUser(email: string, username: string, googleId: string) {
  return db.user.create({
    data: { email, username, googleId },
  });
}

function linkOAuth(userId: string, googleId: string) {
  return db.user.update({
    where: { id: userId },
    data: { googleId },
  });
}

function activate(email: string) {
  return db.user.update({
    where: { email },
    data: { activationToken: null },
  });
}

function getAllActive() {
  return db.user.findMany({ where: { activationToken: null } });
}

export const usersRepository = {
  getByEmail,
  getByUsername,
  findByGoogleId,
  create,
  createOAuthUser,
  linkOAuth,
  activate,
  getAllActive,
};
