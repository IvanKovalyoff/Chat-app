import { db } from '../utils/db.js';

const HISTORY_LIMIT = 50;

function getByRoom(roomId: string) {
  return db.message.findMany({
    where: { roomId },
    orderBy: { createdAt: 'asc' },
    take: HISTORY_LIMIT,
    include: {
      author: {
        select: { id: true, username: true },
      },
    },
  });
}

function create(text: string, authorId: string, roomId: string) {
  return db.message.create({
    data: { text, authorId, roomId },
    include: {
      author: {
        select: { id: true, username: true },
      },
    },
  });
}

export const messagesRepository = {
  getByRoom,
  create,
};
