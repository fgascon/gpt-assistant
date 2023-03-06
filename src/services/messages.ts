import type { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { useEffect, useState } from 'react';

export type ChatMessageRole = ChatCompletionRequestMessageRoleEnum;

export interface ChatMessage {
  content: string;
  role: ChatMessageRole;
}

type Listener = (message: ChatMessage, messages: ChatMessage[]) => void;

const allMessages: ChatMessage[] = [];
const listeners: Listener[] = [];

export function addMessage(message: ChatMessage) {
  allMessages.push(message);
  listeners.forEach(listener => {
    listener(message, allMessages);
  });
}

function onMessage(listener: Listener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  };
}

export function useMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>(allMessages);
  useEffect(() => {
    return onMessage((_newMessage, allMessages) => {
      setMessages([...allMessages]);
    });
  }, []);
  return messages;
}
