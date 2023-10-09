import { ApplyOptions } from '@sapphire/decorators';
import { Command, container } from '@sapphire/framework';
import axios from 'axios';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { bufferTime, map } from 'rxjs/operators';
import "dotenv/config";
import { fetchTGIStream } from '../lib/tgi';
import prompts from './../lib/prompts.json';

@ApplyOptions<Command.Options>({
  aliases: ["t", "tg"],
	description: 'Hugging Face Large Language Model Text Generation Inference Bot.',
})
export class TgiCommand extends Command {

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: ["t", "tg"],
      description: 'Hugging Face Large Language Model Text Generation Inference Bot.'
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
            .setDescription('Write your question to TGI')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('template')
            .setDescription('Template prompt to use')
            .setChoices({name: 'alpaca', value: 'alpaca'}, {name: 'alpaca-copilot', value: 'alpaca-copilot'})
            .setRequired(false)
        )
        .addNumberOption((option) =>
          option
            .setName('max_new_tokens')
            .setDescription('Maximum generated tokens to TGI')
            .setMaxValue(32768)
            .setMinValue(32)
            .setRequired(false)
        )
        .addNumberOption((option) =>
          option
            .setName('temperature')
            .setDescription('Set temperature to TGI')
            .setMaxValue(2)
            .setMinValue(0.05)
            .setRequired(false)
        )
        .addNumberOption((option) =>
          option
            .setName('repeat_penalty')
            .setDescription('To avoid repeating text gen')
            .setMaxValue(2)
            .setMinValue(0.05)
            .setRequired(false)
        )
        .addNumberOption((option) =>
          option
            .setName('top_k')
            .setDescription('The number of samples to consider for top_k sampling.')
            .setMaxValue(100)
            .setMinValue(0)
            .setRequired(false)
        )
        .addNumberOption((option) =>
          option
            .setName('top_p')
            .setDescription('The cumulative probability of the tokens to keep for nucleus sampling')
            .setMaxValue(1)
            .setMinValue(0.025)
            .setRequired(false)
        )
        .addStringOption((option) => 
          option
          .setName('stream')
          .setDescription('Get stream data response?')
          .setChoices({name: 'stream', value: 'stream'}, {name: 'no-stream', value: 'no-stream'})
          .setRequired(false)
        )
        .addNumberOption((option) =>
          option
            .setName('typical_p')
            .setDescription('typical p')
            .setMaxValue(1)
            .setMinValue(0.025)
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
        idHints: ['1150112226875818197']
      }
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const { client } = container;
    // console.log('inside command');
    // console.log(process.env["TGI_URL"]);
    // const controller = new AbortController();
    // const ourRequest = axios.CancelToken.source();
    const input = {
      prompt: interaction.options.get('prompt')?.value,
      systemPrompt: interaction.options.get('character')?.value ? prompts.system[parseInt(`${interaction.options.get('character')?.value}`, 10)] : 'You are a helpful assistant.',
      template: interaction.options.get('template')?.value ?? 'chatml',
      maxNewTokens: interaction.options.get('max_new_tokens')?.value ?? 2048,
      temperature: interaction.options.get('temperature')?.value ?? 0.1,
      repeatPenalty: interaction.options.get('repeat_penalty')?.value ?? 1.3,
      topK: interaction.options.get('top_k')?.value ?? 50,
      topP: interaction.options.get('top_p')?.value ?? 0.95,
      typicalP: interaction.options.get('typical_p')?.value ?? 0.95,
      stream: (interaction.options.get('stream')?.value && interaction.options.get('stream')?.value === 'no-stream') ? false : true,
      delay: 600,
      chunkData: [] as string[],
      streamData: '',
    };

    const cancel = new ButtonBuilder()
      .setCustomId(`tgi-cancel-${interaction.id}`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger);

    const regenerate = new ButtonBuilder()
      .setCustomId(`tgi-regenerate-${interaction.id}`)
      .setLabel('Regenerate')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(cancel);

    await interaction.deferReply();
    const infoTGI = await axios.get(`${process.env["TGI_URL"]}/info`);
    const observable = fetchTGIStream(input);

    const pipe = observable.pipe(
      map(chunk => {
        try {
          const chunkStr = chunk.toString().split('data:')[1];
          const parsedChunk = (chunkStr) && JSON.parse(chunkStr);
          return (parsedChunk && parsedChunk.token) ? parsedChunk.token.text : '';
        } catch (error) {
          return '';
        }
      }),
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
            .setFooter({ text: infoTGI.data.model_id, iconURL: `https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/6426d3f3a7723d62b53c259b/waPyqc71Im-fpVAOiC0BW.jpeg?w=200&h=200&f=face`});
          await interaction.editReply({
            embeds: [embed],
            components: [row],
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
          .setFooter({ text: infoTGI.data.model_id, iconURL: `https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/6426d3f3a7723d62b53c259b/waPyqc71Im-fpVAOiC0BW.jpeg?w=200&h=200&f=face`});
          await interaction.editReply({
            embeds: [embed, embed1],
            components: [row],
          });
        }
      },
      error: async err => {
        console.error('Error processing chunks:', err);
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
            .setFooter({ text: infoTGI.data.model_id, iconURL: `https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/6426d3f3a7723d62b53c259b/waPyqc71Im-fpVAOiC0BW.jpeg?w=200&h=200&f=face`});
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
            .setFooter({ text: infoTGI.data.model_id, iconURL: `https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/6426d3f3a7723d62b53c259b/waPyqc71Im-fpVAOiC0BW.jpeg?w=200&h=200&f=face`});
          await interaction.editReply({
            embeds: [embed, embed1],
            components: [],
          });
        }
      },
    });

    client.on('interactionCreate', async (interactionButton) => {
      try {
        if (!interactionButton.isButton()) return;
        if (interactionButton.customId === `tgi-cancel-${interaction.id}`) {
          subscription.unsubscribe();
          if (input.streamData.length <= 4094) {
            const embed = new EmbedBuilder()
              .setColor(0x111111)
              .setTitle(`${(input.prompt as string).substring(0, 250)}`)
              .setDescription(`~~${input.streamData.substring(0,4090)}~~`)
              .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}`, url: 'https://discord.com/channels/955986297430900777/1108852303617859644' })
              .setFooter({ text: infoTGI.data.model_id, iconURL: `https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/6426d3f3a7723d62b53c259b/waPyqc71Im-fpVAOiC0BW.jpeg?w=200&h=200&f=face`});
            await interaction.editReply({
              embeds: [embed],
              components: [],
            });
          } else if (input.streamData.length > 4094) {
            const embed = new EmbedBuilder()
              .setColor(0x111111)
              .setTitle(`${(input.prompt as string).substring(0, 250)}`)
              .setDescription(`~~${input.streamData.substring(0,4090)}~~`)
              .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}`, url: 'https://discord.com/channels/955986297430900777/1108852303617859644' });
            const embed1 = new EmbedBuilder()
              .setColor(0x111111)
              .setDescription(`~~${input.streamData.substring(4091,5700)}~~`)
              .setFooter({ text: infoTGI.data.model_id, iconURL: `https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/6426d3f3a7723d62b53c259b/waPyqc71Im-fpVAOiC0BW.jpeg?w=200&h=200&f=face`});
            await interaction.editReply({
              embeds: [embed, embed1],
              components: [],
            });
          }
        }
      } catch (error) {
        console.log(error);
      }
    });
  }
}
