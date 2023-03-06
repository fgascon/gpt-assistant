import { type Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { replaceTokens } from '~/services/tokenizer';
import { type ChatMessage } from '~/services/messages';

export interface MessageProps {
  message: ChatMessage;
}

function getAvatarUrl(sessionData: Session | null, role: ChatMessage['role']) {
  if (role === 'user') {
    return sessionData?.user.image;
  }
  if (role === 'assistant') {
    return 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=144&h=144';
  }
  return 'https://images.unsplash.com/photo-1629709305580-5a833dc72d4a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=144&h=144';
}

const colorClass: Record<ChatMessage['role'], string> = {
  user: 'bg-blue-600 text-white',
  assistant: 'bg-gray-300 text-gray-600',
  system: 'bg-gray-200 text-gray-600',
};

export default function Message({ message }: MessageProps) {
  const { data: sessionData } = useSession();
  const avatar = getAvatarUrl(sessionData, message.role);
  const side = message.role === 'user' ? 'right' : 'left';
  return (
    <div className="chat-message">
      <div
        className={`flex items-end${side === 'right' ? ' justify-end' : ''}`}
      >
        <div
          className={`${
            side === 'right' ? 'order-1' : 'order-2'
          } mx-2 flex max-w-xs flex-col items-end space-y-2 text-xs`}
        >
          <div>
            <span
              className={`inline-block rounded-lg px-4 py-2 ${
                side === 'right' ? 'rounded-br-none' : 'rounded-bl-none'
              } ${colorClass[message.role]}`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} linkTarget="_blank">
                {replaceTokens(message.content)}
              </ReactMarkdown>
            </span>
          </div>
        </div>
        {avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt="User"
            className={`${
              side === 'right' ? 'order-2' : 'order-1'
            } h-6 w-6 rounded-full`}
          />
        )}
      </div>
    </div>
  );
}
