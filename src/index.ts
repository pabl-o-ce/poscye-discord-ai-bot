import { SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits, Partials } from 'discord.js';
import "dotenv/config";

function initializeEnv() {
	// do not start the bot if token is not found
	if (!process.env.TOKEN) throw Error("Token not found!")

	// set to default values if not defined already
	process.env.TESTING ??= "false"
	process.env.PREFIX_PROD ??= "-"
	process.env.PREFIX_DEV ??= "b-"

	process.env.PREFIX =
		process.env.TESTING == "true"
			? process.env.PREFIX_DEV
			: process.env.PREFIX_PROD
}

const client = new SapphireClient({
  caseInsensitiveCommands: true,
  caseInsensitivePrefixes: true,
  partials: [
		// necessary for DM events to work
		// https://discordjs.guide/popular-topics/partials.html#enabling-partials

		// "CHANNEL",
    Partials.Channel,

		// necessary for reaction detection to work

		Partials.Message,
		Partials.Reaction,
		Partials.User,
	],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessages,
  ],
  defaultCooldown: {
		delay: 1_000,
		filteredUsers: process.env.OWNER_IDS?.split(","),
		limit: 5,
	},
});

/*
Start the bot
*/

try {
	client.login(process.env.TOKEN)
} catch (err) {
	console.log("The bot crashed")
	console.error(err)
	client.destroy()
}