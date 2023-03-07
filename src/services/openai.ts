import { api } from '~/utils/api';
import type {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
} from 'openai';
import { useEffect, useState } from 'react';

type UsageListener = (cost: number) => void;

let totalCost = 0;
const usageListeners: UsageListener[] = [];

function onUsageChange(listener: UsageListener) {
  usageListeners.push(listener);
  return () => {
    const index = usageListeners.indexOf(listener);
    if (index >= 0) {
      usageListeners.splice(index, 1);
    }
  };
}

function addUsageCost(cost: number) {
  totalCost += cost;
  usageListeners.forEach(listener => {
    listener(totalCost);
  });
}

export function useUsageCost() {
  const [cost, setCost] = useState(0);
  useEffect(() => onUsageChange(setCost), []);
  return cost;
}

export async function createChatCompletion(
  messages: ChatCompletionRequestMessage[]
): Promise<ChatCompletionResponseMessage | undefined> {
  const { message, cost } = await api.openai.createChatCompletion.query(
    messages
  );
  if (cost > 0) {
    addUsageCost(cost);
  }
  return message;
}

export async function generateImage(prompt: string) {
  const { url, cost } = await api.openai.generateImage.query(prompt, {});
  if (cost > 0) {
    addUsageCost(cost);
  }
  return url;
}
