# Discord.js Prefix Bot + Dashboard

A modern prefix-based Discord.js v14 bot with command/event handlers, a clean embed style (with your logo and banner), and a simple Express.js dashboard.

## Setup

1. Install dependencies

```powershell
npm install
```

2. Configure environment

Create or edit `.env` in the project root:

```
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
PREFIX=!
PORT=3005
LOGO_URL=https://cdn.discordapp.com/attachments/1335734480253747297/1402442222816989346/logoglow.png?ex=689d281a&is=689bd69a&hm=1acf86e244991b170fcbd1a9b0e68e1a0f25423845fc36e6e7381df4ec36b8eb&
BANNER_URL=https://cdn.discordapp.com/attachments/1335734480253747297/1402473578254962808/banner3.png?ex=689d454d&is=689bf3cd&hm=ead97252818d9c11ceea7650d0fffe8a783afe8c2d33abd1bdaff51f5c584207&
```

3. Run bot and dashboard in separate terminals

```powershell
npm run start:bot
npm run dashboard
```

Dashboard: http://localhost:%PORT% (default 3005)

If you see EADDRINUSE, free the port:
```powershell
Get-NetTCPConnection -LocalPort 3005 -State Listen | Select-Object OwningProcess | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## Commands

Categories and examples (use your configured prefix):

- General: `ping`, `info`, `help [command]`
- Fun: `coinflip`, `8ball <question>`
- Util: `avatar [@user]`, `server`, `stats`
- Admin: `purge <1-100>`, `setprefix <newPrefix>`

Use `!help` to see an auto-generated categorized list, or `!help command` for details.

## Notes

- Embeds use your logo as thumbnail and banner as image across commands for a consistent look.
- The dashboard reads live stats from `data/status.json` written by the bot when it starts and on key events.
- Change styles in `dashboard/public/style.css` and the view in `dashboard/views/index.ejs`.
- GitHub commit notifier: set `GITHUB_REPO=owner/name` and `GITHUB_UPDATES_CHANNEL_ID=123456789012345678` (a text channel) to auto-post new commits every 5 minutes (configurable with `GITHUB_POLL_INTERVAL_MS`). Optionally provide `GITHUB_TOKEN` for private or higher rate limit access.
- Dashboard OAuth (Discord): set `CLIENT_ID`, `CLIENT_SECRET`, optionally `CALLBACK_URL` to enable login + per-guild filtering and gated dashboard access.

## Deploy to Dokploy

Option A: Build from Git repo (recommended)

1. Push this repo to GitHub.
2. In Dokploy, create a new App from Git and select this repository.
3. Set Dockerfile path to `Dockerfile`.
4. Set environment variables:
	- `DISCORD_TOKEN` (required)
	- `PREFIX` (default `!`)
	- `PORT` (default `3005`)
	- `LOGO_URL` and `BANNER_URL` (optional)
	- `GITHUB_REPO`, `GITHUB_UPDATES_CHANNEL_ID` (optional commit notifications)
	- `API_TOKEN` (optional bearer for metrics/activity writes)
5. Expose port 3005 and map it to your domain.

Option B: Build locally and push image

```powershell
# Build
docker build -t youruser/discord-bot-dashboard:latest .
# Run locally (optional)
docker run --rm -e DISCORD_TOKEN=xxx -e PREFIX=! -e PORT=3005 -p 3005:3005 youruser/discord-bot-dashboard:latest
```

In Dokploy, create an app from the image `youruser/discord-bot-dashboard:latest`, set the same envs, and expose port 3005.

Healthcheck: the container reports healthy when `GET /api/status` returns 200.
