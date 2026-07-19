import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './api/auth.router.js';
import { usersRouter } from './api/users.router.js';
import { oauthRouter } from './api/oauth.router.js';

export const app = express();

// Render/Railway/Fly terminate TLS at a reverse proxy in front of the app,
// so Express needs this to see requests as secure (required for secure cookies).
app.set('trust proxy', 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.sendStatus(200);
});

app.use('/auth', authRouter);
app.use('/auth', oauthRouter);
app.use('/users', usersRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});
