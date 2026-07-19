import { create } from 'zustand';

export type Room = {
  id: string;
  name: string;
  createdAt: string;
};

export type Message = {
  id: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
  };
};

type ChatStore = {
  rooms: Room[];
  currentRoom: Room | null;
  messages: Message[];
  typingUsers: string[];

  setRooms: (rooms: Room[]) => void;
  setCurrentRoom: (room: Room, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  addTypingUser: (username: string) => void;
  removeTypingUser: (username: string) => void;
  reset: () => void;
};

export const useChatStore = create<ChatStore>(set => ({
  rooms: [],
  currentRoom: null,
  messages: [],
  typingUsers: [],

  setRooms: rooms => set({ rooms }),

  setCurrentRoom: (room, messages) =>
    set({ currentRoom: room, messages, typingUsers: [] }),

  addMessage: message =>
    set(state => ({ messages: [...state.messages, message] })),

  addTypingUser: username =>
    set(state => ({
      typingUsers: state.typingUsers.includes(username)
        ? state.typingUsers
        : [...state.typingUsers, username],
    })),

  removeTypingUser: username =>
    set(state => ({
      typingUsers: state.typingUsers.filter(u => u !== username),
    })),

  reset: () =>
    set({ rooms: [], currentRoom: null, messages: [], typingUsers: [] }),
}));
