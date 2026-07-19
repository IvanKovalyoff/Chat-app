import type { Room } from '@prisma/client';
import type { Server, Socket } from 'socket.io';
import { roomsRepository } from '../entity/rooms.repository.js';
import { messagesRepository } from '../entity/messages.repository.js';
import type { NormalizedUser } from '../services/user.service.js';

// Track typing users per room: roomId -> Set of usernames
const typingUsers = new Map<string, Set<string>>();

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as NormalizedUser;

    console.log(`[socket] connected: ${user.username} (${socket.id})`);

    // ----------------------------------------------------------------
    // Send full room list immediately on connect
    // ----------------------------------------------------------------
    roomsRepository.getAll().then((rooms: Room[]) => {
      socket.emit('room_list', { rooms });
    });

    // ----------------------------------------------------------------
    // Get room list on demand
    // ----------------------------------------------------------------
    socket.on('get_rooms', async () => {
      const rooms = await roomsRepository.getAll();
      socket.emit('room_list', { rooms });
    });

    // ----------------------------------------------------------------
    // Join a room
    // ----------------------------------------------------------------
    socket.on('join_room', async ({ roomId }: { roomId: string }) => {
      const room = await roomsRepository.getById(roomId);

      if (!room) {
        socket.emit('server_error', { message: 'Room not found' });
        return;
      }

      // Leave any previously joined rooms
      for (const r of socket.rooms) {
        if (r !== socket.id) socket.leave(r);
      }

      socket.join(roomId);

      const messages = await messagesRepository.getByRoom(roomId);

      socket.emit('room_joined', { room, messages });
    });

    // ----------------------------------------------------------------
    // Create a room
    // ----------------------------------------------------------------
    socket.on('create_room', async ({ name }: { name: string }) => {
      const trimmed = name?.trim();

      if (!trimmed) {
        socket.emit('server_error', { message: 'Room name is required' });
        return;
      }

      const existing = await roomsRepository.getByName(trimmed);

      if (existing) {
        socket.emit('server_error', { message: 'Room name is already taken' });
        return;
      }

      const room = await roomsRepository.create(trimmed);

      // Broadcast updated room list to everyone
      const rooms = await roomsRepository.getAll();
      io.emit('room_list', { rooms });

      // Auto-join the creator
      socket.join(room.id);
      const messages = await messagesRepository.getByRoom(room.id);
      socket.emit('room_joined', { room, messages });
    });

    // ----------------------------------------------------------------
    // Rename a room
    // ----------------------------------------------------------------
    socket.on(
      'rename_room',
      async ({ roomId, name }: { roomId: string; name: string }) => {
        const trimmed = name?.trim();

        if (!trimmed) {
          socket.emit('server_error', { message: 'Room name is required' });
          return;
        }

        const existing = await roomsRepository.getByName(trimmed);

        if (existing) {
          socket.emit('server_error', {
            message: 'Room name is already taken',
          });
          return;
        }

        try {
          const room = await roomsRepository.rename(roomId, trimmed);
          const rooms = await roomsRepository.getAll();

          io.emit('room_list', { rooms });
          io.to(roomId).emit('room_renamed', { room });
        } catch {
          socket.emit('server_error', { message: 'Failed to rename room' });
        }
      },
    );

    // ----------------------------------------------------------------
    // Delete a room
    // ----------------------------------------------------------------
    socket.on('delete_room', async ({ roomId }: { roomId: string }) => {
      try {
        await roomsRepository.remove(roomId);

        const rooms = await roomsRepository.getAll();

        io.emit('room_list', { rooms });
        io.to(roomId).emit('room_deleted', { roomId });
      } catch {
        socket.emit('server_error', { message: 'Failed to delete room' });
      }
    });

    // ----------------------------------------------------------------
    // Send a message
    // ----------------------------------------------------------------
    socket.on('send_message', async ({ text }: { text: string }) => {
      const trimmed = text?.trim();

      if (!trimmed) return;

      // Find the room this socket is currently in
      const roomId = [...socket.rooms].find(r => r !== socket.id);

      if (!roomId) {
        socket.emit('server_error', { message: 'You are not in a room' });
        return;
      }

      const message = await messagesRepository.create(trimmed, user.id, roomId);

      io.to(roomId).emit('new_message', { message });
    });

    // ----------------------------------------------------------------
    // Typing indicators
    // ----------------------------------------------------------------
    socket.on('typing_start', ({ roomId }: { roomId: string }) => {
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }

      typingUsers.get(roomId)!.add(user.username);

      socket.to(roomId).emit('user_typing', {
        username: user.username,
        roomId,
      });
    });

    socket.on('typing_stop', ({ roomId }: { roomId: string }) => {
      typingUsers.get(roomId)?.delete(user.username);

      socket.to(roomId).emit('user_stopped_typing', {
        username: user.username,
        roomId,
      });
    });

    // ----------------------------------------------------------------
    // Disconnect — clean up typing state
    // ----------------------------------------------------------------
    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${user.username} (${socket.id})`);

      for (const [roomId, users] of typingUsers) {
        if (users.has(user.username)) {
          users.delete(user.username);
          io.to(roomId).emit('user_stopped_typing', {
            username: user.username,
            roomId,
          });
        }
      }
    });
  });
}
