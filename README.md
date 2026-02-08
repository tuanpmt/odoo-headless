# Odoo Headless

Modern web UI for Odoo 17, connecting directly to PostgreSQL. Keeps Odoo's DB schema intact.

## Stack

- **Backend:** Node.js + Express
- **Frontend:** EJS + Tailwind CSS (CDN)
- **Database:** Odoo 17's PostgreSQL (direct connection)

## Modules

- 📊 Dashboard — overview stats
- 🎯 CRM — leads & opportunities
- 🎫 Tickets — support ticket management
- 👥 Contacts — customer directory

## Quick Start

```bash
# 1. Start Odoo + PostgreSQL
docker compose up -d

# 2. Install dependencies
npm install

# 3. Configure
cp .env.example .env
# Edit .env with your DB credentials

# 4. Run
npm start
```

## Deploy

```bash
git clone https://github.com/tuanpmt/odoo-headless.git
cd odoo-headless
npm install
cp .env.example .env
npm start
```

## License

MIT
