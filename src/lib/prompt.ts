
import prompts from './prompts.json';

function getTemplatePrompt (prompt: string, systemPrompt: string, templateName: string): string {
  const templatePrompt = prompts.templates.find(t=>t.name===templateName)?.template.replace('{{PROMPT}}',prompt).replace('{{SYSTEM}}',systemPrompt);
  if (typeof templatePrompt === 'string') {
    return templatePrompt;
  } else {
    console.log(new Error('templatePrompt: undefined. templateName dont exist'));
    return '';
  }
}

export { getTemplatePrompt };