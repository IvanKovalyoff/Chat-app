import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore.ts';
import { useAuthStore } from '../store/authStore.ts';

export default function MessageList() {
  const messages = useChatStore(state => state.messages);
  const user = useAuthStore(state => state.user);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
        No messages yet. Say hello!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
      {messages.map(msg => {
        const isOwn = msg.author.id === user?.id;
        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
          >
            <span className="text-xs text-gray-500 mb-0.5 px-1">
              {isOwn ? 'You' : msg.author.username}
            </span>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                isOwn
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-gray-800 text-gray-100 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-xs text-gray-600 mt-0.5 px-1">
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
