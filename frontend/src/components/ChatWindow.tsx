import { useRef } from 'react';
import MessageList from './MessageList.tsx';
import MessageInput from './MessageInput.tsx';
import TypingIndicator from './TypingIndicator.tsx';
import { useChatStore } from '../store/chatStore.ts';

export default function ChatWindow({ onBack }: { onBack: () => void }) {
  const currentRoom = useChatStore(state => state.currentRoom);
  const touchStartX = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 60) onBack();
    touchStartX.current = null;
  }

  return (
    <div
      className="flex flex-col flex-1 h-screen bg-gray-950"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Room header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden text-gray-400 hover:text-white text-lg leading-none"
          aria-label="Back to rooms"
        >
          ←
        </button>
        {currentRoom ? (
          <h2 className="text-white font-semibold"># {currentRoom.name}</h2>
        ) : (
          <h2 className="text-gray-600 font-semibold">
            Select a room to start chatting
          </h2>
        )}
      </div>

      {/* Messages */}
      <MessageList />

      {/* Typing indicator sits just above the input */}
      <TypingIndicator />

      {/* Input */}
      <MessageInput />
    </div>
  );
}
