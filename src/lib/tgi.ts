import axios from 'axios';
import { Observable } from 'rxjs';
import { tgi } from '../types/app-types';
import { getTemplatePrompt } from './prompt';
import "dotenv/config";

function fetchTGI(input: tgi) {
  const controller = new AbortController();
  return new Observable<string>(observer => {
    const fetchData = async () => {
      try {
        const response = await axios.post(`${process.env["TGI_URL"]}`, {
          inputs: `${getTemplatePrompt(`${input.prompt}`, `${input.systemPrompt}`, `${input.template}`)}`,
          stream: false,
          parameters: {
            repetition_penalty: input.repeatPenalty,
            max_new_tokens: input.maxNewTokens,
            temperature: input.temperature,
            top_p: input.topP,
            top_k: input.topK,
            truncate: null,
            typical_p: input.typicalP,
            watermark: true,
          }
        }, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        observer.next(response.data);
      } catch (error) {
        observer.error(error);
      } finally {
        observer.complete();
      }
    };
    fetchData();
    return () => {
      controller.abort();
    };
  });
}

function fetchTGIInfo(input: tgi) {
  const controller = new AbortController();
  return new Observable<string>(observer => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env["TGI_URL"]}/info`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        observer.next(response.data);
      } catch (error) {
        observer.error(error);
      } finally {
        observer.complete();
      }
    };
    fetchData();
    return () => {
      controller.abort();
    };
  });
}

function fetchTGIStream(input: any) {
  const controller = new AbortController();
  return new Observable<Buffer>(observer => {
    const fetchData = async () => {
      try {
        const response = await axios.post(`${process.env["TGI_URL"]}`, {
          inputs: `${getTemplatePrompt(`${input.prompt}`, `${input.systemPrompt}`, `${input.template}`)}`,
          stream: true,
          parameters: {
            repetition_penalty: input.repeatPenalty,
            max_new_tokens: input.maxNewTokens,
            temperature: input.temperature,
            top_p: input.topP,
            top_k: input.topK,
            truncate: null,
            typical_p: input.typicalP,
            watermark: true,
          }
        }, {
          signal: controller.signal,
          responseType: 'stream',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        response.data.on('data', (chunk: Buffer) => {
          observer.next(chunk);
        });
        response.data.on('end', () => observer.complete());
        response.data.on('error', (error: Error) => observer.error(error));
      } catch (error) {
        observer.error(error);
      }
    };
    fetchData();
    return () => {
      controller.abort();
    };
  });
}

export {fetchTGI, fetchTGIStream};