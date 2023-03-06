import { useState } from 'react';
import { promptBot } from '~/services/bot';
import { addMessage, type ChatMessage } from '~/services/messages';
import Header from './header/Header';
import Messages from './messages/Messages';
import Prompt from './prompt/Prompt';

export default function Chat() {
  const [inputDisabled, setInputDisabled] = useState(false);

  function onSubmit(message: ChatMessage) {
    setInputDisabled(true);
    addMessage(message);
    promptBot(message)
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        setInputDisabled(false);
      });
  }

  return (
    <div className="p:2 flex h-screen flex-1 flex-col justify-between sm:p-6">
      <Header />
      <Messages />
      <Prompt onSubmit={onSubmit} disabled={inputDisabled} />
    </div>
  );
}
