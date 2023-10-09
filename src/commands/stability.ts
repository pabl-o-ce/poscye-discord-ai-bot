import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import "dotenv/config";

@ApplyOptions<Command.Options>({
  aliases: ["sb", "sbl"],
	description: 'Stability.ai DreamStudio for StableDiffusion Model Image Generation Bot.',
})
export class StabilityCommand extends Command {

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: ["sb", "sbl"],
      description: 'Stability.ai DreamStudio for StableDiffusion Model Image Generation Bot.'
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
            .setDescription('Write your prompt to generate image using StableDiffusion')
            .setMaxLength(2000)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('negative_prompt')
            .setDescription('Write your negative prompt to generate image using StableDiffusion')
            .setMaxLength(2000)
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('engine')
            .setDescription('The engine model for generated images.')
            .setChoices(
              {name: 'Stable Diffusion XL v1.0', value: 'stable-diffusion-xl-1024-v1-0'},
              {name: 'Stable Diffusion XL v0.9', value: 'stable-diffusion-xl-1024-v0-9'},
              {name: 'Stable Diffusion v2.2.2-XL Beta', value: 'stable-diffusion-xl-beta-v2-2-2'},
              {name: 'Stable Diffusion v2.1', value: 'stable-diffusion-512-v2-1'},
              {name: 'Stable Diffusion v2.1-768', value: 'stable-diffusion-768-v2-1'},
              {name: 'Stable Diffusion v1.5', value: 'stable-diffusion-v1-5'})
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('size')
            .setDescription('The size of the image in pixels.')
            .setChoices(
              {name: '512x512', value: '512x512'},
              {name: '1024x1024', value: '1024x1024'},
              {name: '1152x896', value: '1152x896'},
              {name: '1216x832', value: '1216x832'},
              {name: '1344x768', value: '1344x768'},
              {name: '1536x640', value: '1536x640'},
              {name: '640x1536', value: '640x1536'},
              {name: '768x1344', value: '768x1344'},
              {name: '832x1216', value: '832x1216'},
              {name: '896x1152', value: '896x1152'}
            )
            .setRequired(false)
        )
        .addNumberOption((option) =>
          option
            .setName('cfg_scale')
            .setDescription('How strictly the diffusion process adheres to the prompt text. Must be between 0 and 35.')
            .setMaxValue(35)
            .setMinValue(0)
            .setRequired(false)
        )
        .addNumberOption((option) =>
          option
            .setName('samples')
            .setDescription('Number of images to generate. Must be between 1 and 9.')
            .setMaxValue(9)
            .setMinValue(1)
            .setRequired(false)
        )
        .addNumberOption((option) =>
          option
            .setName('seed')
            .setDescription('Random noise seed (omit this option or use 0 for a random seed). Must be between 0 and 4294967295.')
            .setMaxValue(4294967295)
            .setMinValue(1)
            .setRequired(false)
        )
        .addNumberOption((option) =>
          option
            .setName('steps')
            .setDescription('Number of diffusion steps to run. Must be between 10 and 150.')
            .setMaxValue(150)
            .setMinValue(10)
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('style_preset')
            .setDescription('Pass in a style preset to guide the image model towards a particular style.')
            .setChoices(
              {name: '3D model', value: '3d-model'},
              {name: 'Analog film', value: 'analog-film'},
              {name: 'Anime', value: 'anime'},
              {name: 'Cinematic', value: 'cinematic'},
              {name: 'Comic book', value: 'comic-book'},
              {name: 'Digital art', value: 'digital-art'},
              {name: 'Enhance', value: 'enhance'},
              {name: 'Fantasy art', value: 'fantasy-art'},
              {name: 'Isometric', value: 'isometric'},
              {name: 'Line art', value: 'line-art'},
              {name: 'Low poly', value: 'low-poly'},
              {name: 'Modeling-compound', value: 'modeling-compound'},
              {name: 'Neon punk', value: 'neon-punk'},
              {name: 'Origami', value: 'origami'},
              {name: 'Photographic', value: 'photographic'},
              {name: 'Pixel art', value: 'pixel-art'},
              {name: 'Tile texture', value: 'tile-texture'}
            )
            .setRequired(false)
        ),
      {
        idHints: ['1157896504216920095']
      }
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const stabilitySDToken = process.env.STABILITY_SD_TOKEN;
    const apiHost = 'https://api.stability.ai';
    const input = {
      engine_id: interaction.options.get('engine')?.value ?? 'stable-diffusion-xl-1024-v1-0',
      height: interaction.options.get('size')?.value ? `${interaction.options.get('size')?.value}`.split('x')[0] : 1024,
      width: interaction.options.get('size')?.value ? `${interaction.options.get('size')?.value}`.split('x')[1] : 1024,
      text_prompts: [
        {
          text: `${interaction.options.get('prompt')?.value?.toString()}`,
          weight: 1
        }
      ],
      cfg_scale: interaction.options.get('cfg_scale')?.value ?? 7,
      samples: interaction.options.get('samples')?.value ?? 1,
      seed: interaction.options.get('seed')?.value ?? 0,
      steps: interaction.options.get('steps')?.value ?? 50,
    };
    await interaction.deferReply();
    if (interaction.options.get('negative_prompt')?.value) {
      input.text_prompts.push({
        text: `${interaction.options.get('negative_prompt')?.value?.toString()}`,
        weight: -1
      })
    }
    const response = await fetch(
      `${apiHost}/v1/generation/${input.engine_id}/text-to-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${stabilitySDToken}`,
        },
        body: JSON.stringify({
          text_prompts: [...input.text_prompts],
          cfg_scale: parseInt(`${input.cfg_scale}`, 10),
          height: parseInt(`${input.height}`, 10),
          width: parseInt(`${input.width}`, 10),
          samples: parseInt(`${input.samples}`, 10),
          seed: input.seed,
          steps: parseInt(`${input.steps}`, 10),
        }),
      }
    );
    interface GenerationResponse {
      artifacts: Array<{
        base64: string
        seed: number
        finishReason: string
      }>
    };
    
    const responseJSON = (await response.json()) as GenerationResponse;
    console.log(responseJSON);
    const imd: Buffer[] = [];
    responseJSON.artifacts.forEach((image) => {
      const imageBuffer = Buffer.from(`${image.base64}`, 'base64');
      imd.push(imageBuffer);
    });
    const dt = `${interaction.options.get('negative_prompt')?.value ? '- **Negative Prompt:** ' + interaction.options.get('negative_prompt')?.value + '  ' : ''}
    ${interaction.options.get('style_preset')?.value ? '- **Style:** \`' + interaction.options.get('style_preset')?.value + '\`  ' : ''}
    - **Cfg Scale:** \`${input.cfg_scale}\`  
    - **Samples:** \`${input.samples}\`  
    - **Size:** \`${input.height+'x'+input.width}\`  
    - **Seed:** \`${input.seed}\`  
    - **Steps:** \`${input.steps}\``;
    const details = new EmbedBuilder()
      .setTitle(`${input.text_prompts[0].text.substring(0,253)}...`)
      .setDescription(dt)
      .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}`, url: 'https://discord.com/channels/955986297430900777/1108852303617859644' })
      .setFooter({ text: `StabilityAI/${input.engine_id}`, iconURL: `https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/643feeb67bc3fbde1385cc25/7vmYr2XwVcPtkLzac_jxQ.png?w=200&h=200&f=face`});
    await interaction.editReply({
      embeds: [details],
      files: imd,
      components: [],
    });
  }
}
