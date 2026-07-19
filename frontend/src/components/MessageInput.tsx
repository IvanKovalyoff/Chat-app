import { useEffect, useState, useRef } from 'react';
import { socket } from '../socket.ts';
import { useChatStore } from '../store/chatStore.ts';

const TYPING_TIMEOUT_MS = 2000;

export default function MessageInput() {
  const currentRoom = useChatStore(state => state.currentRoom);
  const hasNoMessages = useChatStore(state => state.messages.length === 0);
  const [text, setText] = useState('');
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentRoom && hasNoMessages) {
      inputRef.current?.focus();
    }
  }, [currentRoom, hasNoMessages]);

  function startTyping() {
    if (!currentRoom || isTyping.current) return;
    isTyping.current = true;
    socket.emit('typing_start', { roomId: currentRoom.id });
  }

  function stopTyping() {
    if (!currentRoom || !isTyping.current) return;
    isTyping.current = false;
    socket.emit('typing_stop', { roomId: currentRoom.id });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    startTyping();

    // Reset the idle timer on every keystroke
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, TYPING_TIMEOUT_MS);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !currentRoom) return;

    socket.emit('send_message', { text: trimmed });
    setText('');

    // Stop typing indicator immediately on send
    if (typingTimer.current) clearTimeout(typingTimer.current);
    stopTyping();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 px-6 py-4 border-t border-gray-800"
    >
      <input
        ref={inputRef}
        value={text}
        onChange={handleChange}
        placeholder={
          !currentRoom
            ? 'Join a room first…'
            : hasNoMessages
              ? 'Type your message and hit Send to start…'
              : `Message #${currentRoom.name}`
        }
        disabled={!currentRoom}
        className={`flex-1 bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40 ${
          currentRoom && hasNoMessages
            ? 'placeholder-white'
            : 'placeholder-gray-600'
        }`}
      />
      <button
        type="submit"
        disabled={!currentRoom || !text.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );
}
