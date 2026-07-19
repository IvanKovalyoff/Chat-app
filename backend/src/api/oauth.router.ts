import { Router } from 'express';
import { googleRedirect, googleCallback } from './oauth.controller.js';

export const oauthRouter = Router();

oauthRouter.get('/google', googleRedirect);
oauthRouter.get('/google/callback', googleCallback);
