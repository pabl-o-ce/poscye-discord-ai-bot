import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import OpenAI from "openai";
import "dotenv/config";

@ApplyOptions<Command.Options>({
  aliases: ["d", "dl"],
	description: 'OpenAI DALL·E Model Image Generation Bot.',
})
export class DalleCommand extends Command {

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: ["d", "dl"],
      description: 'OpenAI DALL·E Model Image Generation Bot.'
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
            .setDescription('Write your prompt to generate image using DALL·E')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('size')
            .setDescription('The size of the generated images.')
            .setChoices({name: '256x256', value: '256x256'}, {name: '512x512', value: '512x512'}, {name: '1024x1024', value: '1024x1024'})
            .setRequired(false)
        )
        .addNumberOption((option) =>
          option
            .setName('number')
            .setDescription('The number of images to generate. Must be between 1 and 9.')
            .setMaxValue(9)
            .setMinValue(1)
            .setRequired(false)
        ),
      {
        idHints: ['1157792894237806682']
      }
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_TOKEN,
    });
    const input = {
      prompt: interaction.options.get('prompt')?.value,
      size: interaction.options.get('size')?.value ?? '256x256',
      number: interaction.options.get('number')?.value ?? 1,
    };
    await interaction.deferReply();
    const response = await openai.images.generate({
      prompt: `${input.prompt}`,
      n: parseInt(`${input.number}`, 10),
      size: `${input.size}` as any,
      response_format: 'b64_json'
    })
    const imd = [];
    const details = new EmbedBuilder()
        .setTitle(`${(input.prompt as string).substring(0, 250)}`)
        .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}`, url: 'https://discord.com/channels/955986297430900777/1108852303617859644' })
        .setFooter({ text: 'OpenAI/DALL·E', iconURL: `https://cdn.discordapp.com/icons/974519864045756446/d7ec4ed5884437bae0333aa345a97160.webp?size=240`});
    for (const image of response.data) {
      const imageBuffer = Buffer.from(`${image.b64_json}`, 'base64');
      imd.push(imageBuffer);
    }
    await interaction.editReply({
      embeds: [details],
      files: imd,
      components: [],
    });
  }
}
