const memory = new Map<string, string>();

export function replaceTokens(text: string): string {
  let output = text;
  memory.forEach((url, key) => {
    output = output.replaceAll(key, url);
  });
  return output;
}

export function tokenize(url: string): string {
  const resultNumber = memory.size + 1;
  const id = `url-${resultNumber}`;
  memory.set(id, url);
  return id;
}
