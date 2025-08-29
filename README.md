# ECL Reborn

## Setup Discord Authentication

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Copy your Client ID

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your Discord credentials:
   ```
   VITE_DISCORD_CLIENT_ID=your_client_id_here
   VITE_DISCORD_REDIRECT_URI=https://xenok69.github.io/ecl-reborn
   ```

3. **Configure Discord OAuth2 Settings**
   - In Discord Developer Portal → OAuth2 → General
   - Add Redirect URI: `https://xenok69.github.io/ecl-reborn`
   - For local development also add: `http://localhost:5173/ecl-reborn`

## How to publish
`npm run deploy` <- PUBLIC
`npm run dev` <- CLIENT