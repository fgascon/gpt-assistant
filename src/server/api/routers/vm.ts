import { inspect } from 'util';
import { runInNewContext } from 'vm';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { callService, getStates } from './homeassistant';

interface OpenCommand {
  action: 'open';
  url: string;
}

type Command = OpenCommand;

async function tryToGetDevices(promises: Array<Promise<void>>) {
  try {
    const states = await getStates();
    return states.map(state => ({
      id: state.id,
      type: 'light',
      state: state.state === 'on',
      name: state.name,
      setState: (newState: boolean) => {
        promises.push(
          (async () => {
            await callService({
              entityID: state.id,
              domain: state.id.split('.')[0] ?? '',
              service: newState ? 'turn_on' : 'turn_off',
            });
          })()
        );
      },
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function execute(code: string) {
  const promises: Array<Promise<void>> = [];
  let output = '';

  const devices = await tryToGetDevices(promises);

  function log(...args: unknown[]) {
    output += args.map(arg => inspect(arg)).join(' ') + '\n';
  }

  const commands: Command[] = [];

  function open(url: string) {
    commands.push({
      action: 'open',
      url,
    });
  }

  const result: unknown = await runInNewContext(code, {
    devices,
    setTimeout, // TODO: prevent eval by checking for string instead of a function
    setInterval,
    setImmediate,
    console: {
      log,
      debug: log,
      warn: log,
      error: log,
    },
    open,
    window: {
      open,
    },
  });
  if (result) {
    output += String(result);
  }
  await Promise.all(promises);
  return { output, commands };
}

export const vmRouter = createTRPCRouter({
  execute: protectedProcedure.input(z.string()).query(async req => {
    return await execute(req.input);
  }),
});
