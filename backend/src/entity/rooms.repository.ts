import { db } from '../utils/db.js';

function getAll() {
  return db.room.findMany({
    orderBy: { createdAt: 'asc' },
  });
}

function getById(id: string) {
  return db.room.findUnique({
    where: { id },
  });
}

function getByName(name: string) {
  return db.room.findUnique({
    where: { name },
  });
}

function create(name: string) {
  return db.room.create({
    data: { name },
  });
}

function rename(id: string, name: string) {
  return db.room.update({
    where: { id },
    data: { name },
  });
}

async function remove(id: string) {
  await db.message.deleteMany({
    where: { roomId: id },
  });

  return db.room.delete({
    where: { id },
  });
}

export const roomsRepository = {
  getAll,
  getById,
  getByName,
  create,
  rename,
  remove,
};
