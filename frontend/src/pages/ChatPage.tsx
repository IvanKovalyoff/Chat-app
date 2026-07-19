import { useEffect, useState } from 'react';
import { socket } from '../socket.ts';
import { useChatStore, type Room, type Message } from '../store/chatStore.ts';
import { useAuthStore } from '../store/authStore.ts';
import Sidebar from '../components/Sidebar.tsx';
import ChatWindow from '../components/ChatWindow.tsx';

export default function ChatPage() {
  const setRooms = useChatStore(state => state.setRooms);
  const setCurrentRoom = useChatStore(state => state.setCurrentRoom);
  const addMessage = useChatStore(state => state.addMessage);
  const addTypingUser = useChatStore(state => state.addTypingUser);
  const removeTypingUser = useChatStore(state => state.removeTypingUser);
  const reset = useChatStore(state => state.reset);
  const clearAuth = useAuthStore(state => state.clearAuth);

  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  useEffect(() => {
    // Connect socket if not already connected (e.g. after page refresh + token restore)
    if (!socket.connected) {
      socket.connect();
    }

    // ----------------------------------------------------------------
    // Socket event listeners
    // ----------------------------------------------------------------
    function onRoomList({ rooms }: { rooms: Room[] }) {
      setRooms(rooms);
    }

    function onRoomJoined({
      room,
      messages,
    }: {
      room: Room;
      messages: Message[];
    }) {
      setCurrentRoom(room, messages);
    }

    function onNewMessage({ message }: { message: Message }) {
      addMessage(message);
    }

    function onUserTyping({ username }: { username: string }) {
      addTypingUser(username);
    }

    function onUserStoppedTyping({ username }: { username: string }) {
      removeTypingUser(username);
    }

    function onRoomRenamed({ room }: { room: Room }) {
      // Re-fetch rooms is handled by room_list broadcast from the server.
      // Update currentRoom name if we're inside the renamed room.
      useChatStore.setState(state => ({
        currentRoom:
          state.currentRoom?.id === room.id ? room : state.currentRoom,
      }));
    }

    function onRoomDeleted({ roomId }: { roomId: string }) {
      useChatStore.setState(state => ({
        currentRoom:
          state.currentRoom?.id === roomId ? null : state.currentRoom,
        messages: state.currentRoom?.id === roomId ? [] : state.messages,
      }));
    }

    function onConnectError(err: Error) {
      // Token expired or invalid — log out
      if (
        err.message === 'Authentication required' ||
        err.message === 'Invalid or expired token'
      ) {
        clearAuth();
        reset();
      }
    }

    socket.on('room_list', onRoomList);
    socket.on('room_joined', onRoomJoined);
    socket.emit('get_rooms');
    socket.on('new_message', onNewMessage);
    socket.on('user_typing', onUserTyping);
    socket.on('user_stopped_typing', onUserStoppedTyping);
    socket.on('room_renamed', onRoomRenamed);
    socket.on('room_deleted', onRoomDeleted);
    socket.on('connect_error', onConnectError);

    function onRoomJoinedMobile() {
      setMobileView('chat');
    }
    socket.on('room_joined', onRoomJoinedMobile);

    return () => {
      socket.off('room_list', onRoomList);
      socket.off('room_joined', onRoomJoined);
      socket.off('new_message', onNewMessage);
      socket.off('user_typing', onUserTyping);
      socket.off('user_stopped_typing', onUserStoppedTyping);
      socket.off('room_renamed', onRoomRenamed);
      socket.off('room_deleted', onRoomDeleted);
      socket.off('connect_error', onConnectError);
      socket.off('room_joined', onRoomJoinedMobile);
    };
  }, [
    setRooms,
    setCurrentRoom,
    addMessage,
    addTypingUser,
    removeTypingUser,
    reset,
    clearAuth,
  ]);

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar: full-screen on mobile, fixed width on desktop */}
      <div
        className={`
          absolute inset-y-0 left-0 z-10 w-full transition-transform duration-300
          md:relative md:w-64 md:translate-x-0
          ${mobileView === 'sidebar' ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </div>

      {/* Chat: full-screen on mobile, fills remaining space on desktop */}
      <div
        className={`
          absolute inset-y-0 left-0 w-full transition-transform duration-300
          md:relative md:flex-1 md:translate-x-0
          ${mobileView === 'chat' ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <ChatWindow onBack={() => setMobileView('sidebar')} />
      </div>
    </div>
  );
}
