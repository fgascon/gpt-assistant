import { addMessage, type ChatMessage } from './messages';
import { api } from '~/utils/api';
import { createChatCompletion, generateImage } from './openai';
import { speak } from './speech/speak';
import { tokenize } from './tokenizer';

type InternalChatMessage = ChatMessage;

const seaOtterUrl = tokenize('https://example.com');

const internalMessages: InternalChatMessage[] = [];

function addInternalMessage(message: InternalChatMessage) {
  internalMessages.push(message);
  console.log(message);
}

const sydneyMode = false;

async function tryToGetTheDeviceNames() {
  try {
    const devices = await api.homeassistant.getStates.query();
    return devices.map(device => device.name).join(', ');
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
async function init() {
  const deviceNames = await tryToGetTheDeviceNames();
  const sydney = (text: string) => (sydneyMode ? text : '');
  const initialPrompts: InternalChatMessage[] = [
    {
      role: 'system',
      content: `You are an assistant who communicate by running commands. Use a lot of emojis. Possible operations: say, search-google, execute, generate-image\nExecution context:\ndeclare const devices: {type:string;name:string;state:boolean;setState:(newState:boolean)=>void}[]\n${
        deviceNames ? `Device names: ${deviceNames}` : ''
      }`,
    },
    {
      role: 'user',
      content: 'Turn on the lights.',
    },
    {
      role: 'assistant',
      content:
        "execute <<<devices.filter(device=>device.type==='light').forEach(device=>{device.setState(true)})>>>",
    },
    {
      role: 'system',
      content: 'Output: undefined',
    },
    {
      role: 'assistant',
      content: `say <<<I've turned off the lights${sydney(' 😊')}>>>`,
    },
    {
      role: 'user',
      content: "Who's composed the Four Seasons",
    },
    {
      role: 'assistant',
      content: `say <<<The Four Seasons were composed by Antonio Vivaldi.${sydney(
        ' 🎻'
      )}>>>`,
    },
    {
      role: 'user',
      content: 'What time is it?',
    },
    {
      role: 'assistant',
      content: 'execute <<<new Date().toLocaleTimeString()>>>',
    },
    {
      role: 'system',
      content: 'Output: "11:30:59 AM"',
    },
    {
      role: 'assistant',
      content: `say <<<It's 11:30:59 AM${sydney(' 🕰')}>>>`,
    },
    {
      role: 'user',
      content:
        'How many giraffes one on top of each others would it take to reach the moon?',
    },
    {
      role: 'assistant',
      content: 'search-google <<<how many giraffes to reach the moon>>>',
    },
    {
      role: 'system',
      content:
        'Search result: it would be approximately 69,890,910 to reach the moon',
    },
    {
      role: 'assistant',
      content: `say <<<It would take approximately 69,890,910 giraffes to reach the moon${sydney(
        ' 🦒 🌙'
      )}>>>`,
    },
    {
      role: 'user',
      content: 'how heavy would that many giraffes weight?',
    },
    {
      role: 'assistant',
      content: 'search-google <<<average weight of a giraffe>>>',
    },
    {
      role: 'system',
      content:
        'Search result: Males can weigh up to 4,200 pounds (1,900 kg), and females weigh up to 2,600 pounds (1,180 kg)',
    },
    {
      role: 'assistant',
      content: 'execute <<<69890910*(1900+1180)/2>>>',
    },
    {
      role: 'system',
      content: 'Output: 107632001400',
    },
    {
      role: 'assistant',
      content: `say <<<It would weigh approximately 107,632,001,400 kg${sydney(
        ' ⚖️'
      )}>>>`,
    },
    {
      role: 'user',
      content: 'Generage an image of a cute baby sea otter',
    },
    {
      role: 'assistant',
      content: 'generate-image <<<a cute baby sea otter>>>',
    },
    {
      role: 'system',
      content: `Image: ${seaOtterUrl}`,
    },
    {
      role: 'assistant',
      content: `say <<<Here is an image of a cute baby sea otter.${sydney(
        ' 🦦 ❤️'
      )}\n\n![baby sea otter](${seaOtterUrl})>>>`,
    },
  ];

  initialPrompts.forEach(addInternalMessage);
}

const initPromise = init();

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const errorObject = error as { message?: unknown };
    if (typeof errorObject.message === 'string') {
      return errorObject.message;
    }
  }
  return String(error);
}

const commandHandlers: Record<string, (...args: string[]) => Promise<string>> =
  {
    /* display: async (message) => {
    addMessage({
      role: 'bot',
      content: replaceImages(message)
    })
    return 'OK'
  }, */
    execute: async code => {
      const { output, commands } = await api.vm.execute.query(code);
      commands.forEach(command => {
        if (command.action === 'open') {
          window.open(command.url);
        }
      });
      return `Output: ${output}`;
    },
    'search-google': async terms => {
      const result = await api.google.search.query(terms);
      return `Search result: ${JSON.stringify(result)}`;
    },
    /*'query-wolfram': async query => {
      const result = await api.wolframGetSimple.query(query);
      const id = tokenize(result);
      return `Wolfram result: ${id}`;
    },*/
    'generate-image': async prompt => {
      const url = await generateImage(prompt);
      const id = tokenize(url);
      return `Image: ${id}`;
    },
  };

interface Command {
  operation: string;
  arg: string;
}

function parseCommands(text: string) {
  const matches = text.matchAll(/([a-z-]+)\s+<<<(.+?)>>>/gs);
  let filteredText = text;
  const commands: Command[] = [];
  for (const match of matches) {
    const [fullMatch, operation, arg] = match;
    if (operation && arg) {
      commands.push({ operation, arg });
    }
    filteredText = filteredText.replace(fullMatch, '');
  }
  return {
    commands,
    text: filteredText.trim(),
  };
}

async function runCommand({
  operation,
  arg,
}: {
  operation: string;
  arg: string;
}) {
  const commandHandler = commandHandlers[operation];
  if (typeof commandHandler === 'function') {
    try {
      return await commandHandler(arg);
    } catch (error) {
      console.error(error);
      return `Error: ${getErrorMessage(error)}`;
    }
  }
  return `Error: invalid operation "${operation}"`;
}

export async function promptBot(promptMessage: InternalChatMessage) {
  await initPromise;
  addInternalMessage(promptMessage);

  while (true) {
    // completion by the AI
    const response = await createChatCompletion(internalMessages);
    if (!response) {
      break;
    }

    // loop detection
    const lastAssistantResponse = internalMessages
      .concat()
      .reverse()
      .find(message => message.role === 'assistant');
    if (response.content === lastAssistantResponse?.content) {
      break;
    }

    addInternalMessage(response);

    // run the command
    const { commands, text } = parseCommands(response.content);
    if (text.trim().length > 0) {
      addMessage({
        role: 'assistant',
        content: text,
      });
    }
    let keepGoing = false;
    for (const command of commands) {
      if (command.operation === 'say') {
        addMessage({
          role: 'system',
          content: `say <<<${command.arg}>>>`,
        });
        addMessage({
          role: 'assistant',
          content: command.arg,
        });
        await speak(command.arg);
      } else {
        addMessage({
          role: 'system',
          content: `${command.operation} <<<${command.arg}>>>`,
        });
        const commandResult = await runCommand(command);
        addInternalMessage({
          role: 'system',
          content: commandResult,
        });
        addMessage({
          role: 'system',
          content: commandResult,
        });
        keepGoing = true;
      }
    }
    if (!keepGoing) {
      break;
    }
  }
}
