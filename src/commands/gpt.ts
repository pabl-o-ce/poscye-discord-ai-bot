import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import "dotenv/config";
import OpenAIClient from '../lib/gpt/gpt';
import { bufferTime } from 'rxjs/operators';
import prompts from './../lib/prompts.json';

@ApplyOptions<Command.Options>({
  aliases: ["g", "gp"],
	description: 'OpenAI GPT (generative pre-trained transformer) models',
})
export class GptCommand extends Command {

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: ["g", "gp"],
      description: 'OpenAI GPT (generative pre-trained transformer) models'
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    const rb = registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('prompt')
            .setDescription('Write your prompt to GPT models')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('system_prompt')
            .setDescription('System prompt for gpt model')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('model')
            .setDescription('GPT model type')
            .setChoices(
              {name: 'gpt 3.5 turbo', value: 'gpt-3.5-turbo'},
              {name: 'gpt 3.5 0301', value: 'gpt-3.5-turbo-0301'},
              {name: 'gpt 3.5 0613', value: 'gpt-3.5-turbo-0613'},
              {name: 'gpt 4', value: 'gpt-4'},
              {name: 'gpt 4 0314', value: 'gpt-4-0314'},
              {name: 'gpt 4 0613', value: 'gpt-4-0613'}
            )
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('character')
            .setDescription('Choose the characters as a system prompt replacement')
            .setChoices(
              {name: 'accountant', value: '0'},
              {name: 'blockchain', value: '1'},
              {name: 'copilot', value: '2'},
              {name: 'cyber-security', value: '3'},
              {name: 'linux', value: '4'},
              {name: 'machine-learning', value: '5'},
              {name: 'nodejs', value: '6'},
              {name: 'python', value: '7'},
              {name: 'rust', value: '8'},
              {name: 'science', value: '9'},
              {name: 'unix', value: '10'},
              {name: 'ux-ui', value: '11'},
              {name: 'web-design', value: '12'},
            )
            .setRequired(false)
        ),
      {
        idHints: ['1159170097429102662']
      }
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const client = new OpenAIClient();
    const input = {
      prompt: interaction.options.get('prompt')?.value as string,
      system_prompt: interaction.options.get('character')?.value ? prompts.system[parseInt(`${interaction.options.get('character')?.value}`, 10)] : interaction.options.get('system_prompt')?.value ?? 'You are a helpful assistant.',
      model: interaction.options.get('model')?.value ?? 'gpt-3.5-turbo',
      delay: 600,
      streamData: ''
    };
    await interaction.deferReply();

    const observable = client.generateStream$(input.prompt, input.system_prompt as string, input.model as string);
    
    const pipe = observable.pipe(
      bufferTime(input.delay)
    );
    
    const subscription = pipe.subscribe({
      next: async chunk => {
        input.streamData += chunk.reduce((p, c) => `${p+c}`, '');
        if (input.streamData.length <= 4094 && input.streamData.trim().length > 0) {
          const embed = new EmbedBuilder()
            .setColor(0x111111)
            .setTitle(`${(input.prompt as string).substring(0, 250)}`)
            .setDescription(`${input.streamData.substring(0,4094)}`)
            .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}`, url: 'https://discord.com/channels/955986297430900777/1108852303617859644' })
            .setFooter({ text: `OpenAI/${input.model}`, iconURL: `https://cdn.discordapp.com/icons/974519864045756446/d7ec4ed5884437bae0333aa345a97160.webp?size=240`});
          await interaction.editReply({
            embeds: [embed],
            components: [],
          });
        } else if (input.streamData.length > 4094) {
          const embed = new EmbedBuilder()
            .setColor(0x111111)
            .setTitle(`${(input.prompt as string).substring(0, 250)}`)
            .setDescription(`${input.streamData.substring(0,4094)}`)
            .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}`, url: 'https://discord.com/channels/955986297430900777/1108852303617859644' });
          const embed1 = new EmbedBuilder()
          .setColor(0x111111)
          .setDescription(`${input.streamData.substring(4095,5700)}`)
          .setFooter({ text: `OpenAI/${input.model}`, iconURL: `https://cdn.discordapp.com/icons/974519864045756446/d7ec4ed5884437bae0333aa345a97160.webp?size=240`});
          await interaction.editReply({
            embeds: [embed, embed1],
            components: [],
          });
        }
      },
      error: async err => {
        await interaction.reply('There was an error processing your request. Please try again later.');
      },
      complete: async () => {
        console.log('All chunks have been processed.');
        if (input.streamData.length <= 4094) {
          const embed = new EmbedBuilder()
            .setColor(0x111111)
            .setTitle(`${(input.prompt as string).substring(0, 250)}`)
            .setDescription(`${input.streamData.substring(0,4094)}`)
            .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}`, url: 'https://discord.com/channels/955986297430900777/1108852303617859644' })
            .setFooter({ text: `OpenAI/${input.model}`, iconURL: `https://cdn.discordapp.com/icons/974519864045756446/d7ec4ed5884437bae0333aa345a97160.webp?size=240`});
          await interaction.editReply({
            embeds: [embed],
            components: [],
          });
        } else if (input.streamData.length > 4094) {
          const embed = new EmbedBuilder()
            .setColor(0x111111)
            .setTitle(`${(input.prompt as string).substring(0, 250)}`)
            .setDescription(`${input.streamData.substring(0,4094)}`)
            .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}`, url: 'https://discord.com/channels/955986297430900777/1108852303617859644' });
          const embed1 = new EmbedBuilder()
            .setColor(0x111111)
            .setDescription(`${input.streamData.substring(4095,5700)}`)
            .setFooter({ text: `OpenAI/${input.model}`, iconURL: `https://cdn.discordapp.com/icons/974519864045756446/d7ec4ed5884437bae0333aa345a97160.webp?size=240`});
          await interaction.editReply({
            embeds: [embed, embed1],
            components: [],
          });
        }
      },
    });
  }
}
