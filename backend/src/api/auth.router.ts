import { Router, type IRouter } from 'express';
import cookieParser from 'cookie-parser';
import { authController } from './auth.controller.js';

export const authRouter: IRouter = Router();

authRouter.post('/register', authController.register);
authRouter.get('/activation/:email/:token', authController.activate);
authRouter.post('/login', authController.login);
authRouter.get('/refresh', cookieParser(), authController.refresh);
authRouter.post('/logout', cookieParser(), authController.logout);
