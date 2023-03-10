import { createTRPCRouter } from '~/server/api/trpc';
import { openaiRouter } from '~/server/api/routers/openai';
import { homeassistantRouter } from './routers/homeassistant';
import { vmRouter } from './routers/vm';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  openai: openaiRouter,
  homeassistant: homeassistantRouter,
  vm: vmRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
