import OpenAI from "openai";
import { Stream } from "openai/streaming";
import { Observable } from "rxjs";

class OpenAIClient {

  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_TOKEN,
    });
  }
  
  public generateStream$(prompt: string, system_prompt: string, model: string): Observable<string> {
    return new Observable<string>(observer => {
      let stream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk>;
      (async () => {
        try {
          stream = await this.openai.chat.completions.create({
            model: model ?? 'gpt-4',
            messages: [
              { role: 'system', content: `${system_prompt}` },
              { role: 'user', content: `${prompt}` }
            ],
            stream: true,
          });
          for await (const part of stream) {
            console.log(part);
            observer.next(part.choices[0]?.delta?.content || '');
          }
          observer.complete(); 
        } catch (error) {
          observer.error(error);
        }
      })();
  
      return () => {
        if (stream) {
          stream.controller.abort();
        }
      };
    });
  }
}

export default OpenAIClient;