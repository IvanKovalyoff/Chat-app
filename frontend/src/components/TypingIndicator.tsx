import { useChatStore } from '../store/chatStore.ts';

export default function TypingIndicator() {
  const typingUsers = useChatStore(state => state.typingUsers);

  if (typingUsers.length === 0) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : typingUsers.length === 2
        ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
        : 'Several people are typing';

  return (
    <div className="px-6 py-1 flex items-center gap-2">
      <span className="text-xs text-gray-500 italic">{label}</span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-gray-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  );
}
