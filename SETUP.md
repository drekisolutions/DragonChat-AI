# DragonChat AI — Setup Guide

## Quick Start
```bash
npm install
npm run dev
# Open http://localhost:3001
```

## First Login
- Enter any email + password (6+ chars) → creates local account
- Complete 3-step onboarding (business name, brand color, logo)
- You land on the dashboard

## Enable Live AI Responses
By default the chatbot uses smart rule-based fallback responses.
To enable real Claude AI responses:

1. Get your API key at https://console.anthropic.com/settings/keys
2. Open `.env` and replace:
   ```
   ANTHROPIC_API_KEY=sk-ant-REPLACE_WITH_YOUR_ANTHROPIC_API_KEY
   ```
   with your real key
3. Restart the dev server: `npm run dev`

## Install as Desktop App (PWA)
1. Open http://localhost:3001 in Chrome or Edge
2. Click the install icon in the browser address bar
3. Click "Install" — app appears in your Start Menu / Applications
4. Runs offline with all data stored locally

## Deploy to app.drekisolutions.com
1. Push to GitHub
2. Connect to Vercel at vercel.com
3. Add `ANTHROPIC_API_KEY` in Vercel → Settings → Environment Variables
4. Deploy — your clients access it at your custom domain

## Tab Overview
| Tab | What it does |
|-----|-------------|
| Live Preview | Test the chatbot live with real AI responses |
| Configure Bot | Set name, color, greeting, FAQs, lead capture |
| Captured Leads | View and manage leads from chatbot conversations |
| Embed Code | Get the snippet to add the bot to any website |
| Settings | Update branding, colors, logo |
