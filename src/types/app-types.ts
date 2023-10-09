type tgi = {
  prompt: string,
  systemPrompt: string,
  template: string,
  maxNewTokens: number,
  temperature: number,
  repeatPenalty: number,
  topK: number,
  topP: number,
  typicalP: number,
  stream: boolean,
  delay: number,
  chunkData: string[],
  streamData: string,
};

export { tgi };