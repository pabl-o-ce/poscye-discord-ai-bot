---

Project Name: PØscyΞ Discord ΔI BØT

Description: A simple, fun and useful ΔI Discord chatbot.

GitHub Repository Link: https://git.carreraestrada.com/CYE/poscye-discord-bot

---

# PØscyΞ Discord ΔI 8ØT

## Docker

Docker support you can run it:

```sh
docker run -d \
  -it \
  -e NODE_ENV='production' \
  -e TOKEN='discord_token' \
  -e CLIENT_ID='discord_token' \
  -e GUILD_ID='discord_token' \
  -e OPENAI_TOKEN='discord_token' \
  -e TGI_URL='discord_token' \
  --name poscye-discord-bot registry.carreraestrada.com/poscye-discord-bot
```

## Installation

Clone this repository using git clone command in terminal

```sh
git clone https://git.carreraestrada.com/CYE/poscye-discord-bot && cd poscye-tgicord-bot
```

then install all requirements by running:

```sh
pnpm install
```

## Configuration

Create .env file inside root directory of project folder:

```sh
touch .env
```

and add following keys value pairs:

```nvim
NODE_ENV=production

TOKEN=discord_token
CLIENT_ID=discord_client_id
GUILD_ID=discord_guild_id

OPENAI_TOKEN=openai_token

TGI_URL=tgi_url
```

## Run

For run the bot:

```sh
pnpm start
```

## Features

- Can use text generation inference from huggingfaces 🤗.
- Cancel request button
