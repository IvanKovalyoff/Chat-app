import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { registerSocketHandlers } from './socket/handlers.js';
import { jwt } from './utils/jwt.js';
import type { NormalizedUser } from './services/user.service.js';

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// JWT guard — every socket connection must carry a valid access token
io.use((socket, next) => {
  const token = (socket.handshake.auth?.token ||
    socket.handshake.headers?.token) as string;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  const userData = jwt.validateAccessToken(token) as NormalizedUser | null;

  if (!userData) {
    return next(new Error('Invalid or expired token'));
  }

  // Attach user data to the socket so handlers can read it
  socket.data.user = userData;
  next();
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
