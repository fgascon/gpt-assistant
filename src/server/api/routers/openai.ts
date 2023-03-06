import {
  type ChatCompletionRequestMessage,
  Configuration,
  CreateImageRequestSizeEnum,
  OpenAIApi,
} from 'openai';
import { z } from 'zod';

import { env } from '~/env.mjs';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

enum Model {
  GPT35Turbo = 'gpt-3.5-turbo',
  Davinci = 'text-davinci-003',
  Curie = 'text-curie-001',
  Babbage = 'text-babbage-001',
  Ada = 'text-ada-001',
}

const model = Model.GPT35Turbo;
const defaultSize = CreateImageRequestSizeEnum._256x256;

const costPerToken: Record<Model, number> = {
  [Model.GPT35Turbo]: 0.002 / 1000,
  [Model.Davinci]: 0.02 / 1000,
  [Model.Curie]: 0.002 / 1000,
  [Model.Babbage]: 0.0005 / 1000,
  [Model.Ada]: 0.0004 / 1000,
};

const costPerImage: Record<CreateImageRequestSizeEnum, number> = {
  '1024x1024': 0.02,
  '512x512': 0.018,
  '256x256': 0.016,
};

const configuration = new Configuration({
  organization: env.OPENAI_ORGANIZATION,
  apiKey: env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function createChatCompletion(messages: ChatCompletionRequestMessage[]) {
  const response = await openai.createChatCompletion({
    model,
    messages,
    temperature: 0,
    max_tokens: 512,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    // stop: ['>>>', '\n@']
  });

  const tokensUsed = response.data.usage?.total_tokens ?? 0;
  const cost = tokensUsed * costPerToken[model];

  const message = response.data.choices[0]?.message;

  return { message, cost };
}

async function generateImage(prompt: string) {
  const size = defaultSize;
  const response = await openai.createImage({
    prompt,
    n: 1,
    size: '256x256',
  });
  const url = response.data.data[0]?.url;
  if (!url) {
    throw new Error('openai response missing');
  }
  const cost = costPerImage[size] || 0;
  return { url, cost };
}

export const openaiRouter = createTRPCRouter({
  createChatCompletion: protectedProcedure
    .input(
      z.array(
        z.object({
          role: z.union([
            z.literal('system'),
            z.literal('user'),
            z.literal('assistant'),
          ]),
          content: z.string(),
          name: z.string().optional(),
        })
      )
    )
    .query(async req => {
      return await createChatCompletion(req.input);
    }),
  generateImage: protectedProcedure.input(z.string()).query(async req => {
    return await generateImage(req.input);
  }),
});
