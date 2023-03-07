import { api } from '~/utils/api';

async function play(buffer: ArrayBuffer) {
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(buffer);
  await audioContext.resume();
  const outputSource = audioContext.createBufferSource();
  outputSource.buffer = audioBuffer;
  outputSource.connect(audioContext.destination);
  outputSource.start(0);
  await new Promise(resolve => {
    outputSource.onended = resolve;
  });
  await audioContext.close();
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function speak(text: string) {
  if (!text) {
    return;
  }

  throw new Error('Not implemented yet');
  /*const { audioContent } = await api.text2speech.query(text);
  if (!audioContent) {
    return;
  }
  const buffer = Uint8Array.from(atob(audioContent), c =>
    c.charCodeAt(0)
  ).buffer;
  await play(buffer);*/
}

(globalThis as { speak?: typeof speak }).speak = speak;
