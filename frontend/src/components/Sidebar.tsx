import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket.ts';
import { useChatStore, type Room } from '../store/chatStore.ts';
import { useAuthStore } from '../store/authStore.ts';
import { authApi } from '../api/authApi.ts';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const rooms = useChatStore(state => state.rooms);
  const currentRoom = useChatStore(state => state.currentRoom);
  const clearAuth = useAuthStore(state => state.clearAuth);
  const reset = useChatStore(state => state.reset);
  const user = useAuthStore(state => state.user);

  const [newRoomName, setNewRoomName] = useState('');
  const [renamingRoom, setRenamingRoom] = useState<Room | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const newRoomInputRef = useRef<HTMLInputElement>(null);

  const hasNoRooms = rooms.length === 0;

  useEffect(() => {
    if (hasNoRooms) {
      newRoomInputRef.current?.focus();
    }
  }, [hasNoRooms]);

  function joinRoom(roomId: string) {
    socket.emit('join_room', { roomId });
  }

  function createRoom(e: React.FormEvent) {
    e.preventDefault();
    const name = newRoomName.trim();
    if (!name) return;
    socket.emit('create_room', { name });
    setNewRoomName('');
  }

  function startRename(room: Room) {
    setRenamingRoom(room);
    setRenameValue(room.name);
  }

  function submitRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renamingRoom) return;
    socket.emit('rename_room', { roomId: renamingRoom.id, name: renameValue });
    setRenamingRoom(null);
  }

  function deleteRoom(roomId: string) {
    socket.emit('delete_room', { roomId });
  }

  async function handleLogout() {
    await authApi.logout();
    socket.disconnect();
    clearAuth();
    reset();
    navigate('/login');
  }

  return (
    <aside className="w-full md:w-64 flex flex-col bg-gray-900 border-r border-gray-800 h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-white font-bold text-lg">💬 Chat App</h1>
        <p className="text-gray-500 text-xs mt-0.5">@{user?.username}</p>
      </div>

      {/* Rooms label */}
      <p className="text-gray-600 text-xs uppercase tracking-widest px-4 pt-3 pb-1">
        Rooms
      </p>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto pb-2">
        {hasNoRooms && (
          <div className="px-4">
            <p className="text-gray-600 text-sm">No rooms yet</p>
            <p className="text-white text-xs mt-1">
              Create your first room below to get started
            </p>
          </div>
        )}
        {rooms.map(room => (
          <div
            key={room.id}
            className={`group flex items-center justify-between px-4 py-2 cursor-pointer rounded-lg mx-2 mb-0.5 transition ${
              currentRoom?.id === room.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {renamingRoom?.id === room.id ? (
              <form onSubmit={submitRename} className="flex gap-1 w-full">
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-0.5 outline-none"
                />
                <button type="submit" className="text-green-400 text-xs">
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingRoom(null)}
                  className="text-red-400 text-xs"
                >
                  ✕
                </button>
              </form>
            ) : (
              <>
                <span
                  className="flex-1 truncate text-sm"
                  onClick={() => joinRoom(room.id)}
                >
                  # {room.name}
                </span>
                <div className="hidden group-hover:flex gap-1 ml-2">
                  <button
                    onClick={() => startRename(room)}
                    className="text-gray-400 hover:text-white text-xs"
                    title="Rename"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteRoom(room.id)}
                    className="text-gray-400 hover:text-red-400 text-xs"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Create room */}
      <div className="p-3 border-t border-gray-800">
        <form onSubmit={createRoom} className="flex gap-2">
          <input
            ref={newRoomInputRef}
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            placeholder={hasNoRooms ? 'Enter a room name…' : 'New room…'}
            className={`flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 ${
              hasNoRooms ? 'placeholder-white' : 'placeholder-gray-600'
            }`}
          />
          <button
            type="submit"
            disabled={!newRoomName.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg px-3 py-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
        </form>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full text-sm text-gray-500 hover:text-red-400 transition text-left px-2"
        >
          ← Logout
        </button>
      </div>
    </aside>
  );
}
