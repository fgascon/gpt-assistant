import { api } from '~/utils/api';
import type {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
} from 'openai';

type UsageListener = (cost: number) => void;

let totalCost = 0;
const usageListeners: UsageListener[] = [];

export function onUsageChange(listener: UsageListener) {
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

// eslint-disable-next-line @typescript-eslint/require-await
export async function generateImage(prompt: string) {
  throw new Error('Not implemented yet');
  /*const { url, cost } = await api.generateImage.query(prompt);
  if (cost > 0) {
    addUsageCost(cost);
  }
  return url;*/
}
