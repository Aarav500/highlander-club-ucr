# n8n Automation Environment

Self-hosted [n8n](https://n8n.io) workflow engine backed by PostgreSQL.

## Quick Start

```bash
# 1. Create your secrets file
cp .env.example .env          # then edit .env with real values

# 2. Generate a strong encryption key
#    (Linux/macOS)
openssl rand -hex 32          # paste into N8N_ENCRYPTION_KEY
#    (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])

# 3. Start the stack
docker compose up -d

# 4. Open the UI
#    http://localhost:5678
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `N8N_HOST` | — | `localhost` | Hostname n8n binds to |
| `N8N_PORT` | — | `5678` | Exposed port |
| `N8N_PROTOCOL` | — | `http` | `http` or `https` |
| `N8N_ENCRYPTION_KEY` | **yes** | — | Encryption key for credentials |
| `WEBHOOK_URL` | — | `http://localhost:5678/` | Public webhook base URL |
| `DB_POSTGRESDB_PASSWORD` | **yes** | — | PostgreSQL password |
| `DB_POSTGRESDB_DATABASE` | — | `n8n` | Database name |
| `DB_POSTGRESDB_USER` | — | `n8n` | Database user |
| `N8N_API_KEY` | — | — | Custom key for workflows (`{{$env.N8N_API_KEY}}`) |
| `MY_SERVICE_TOKEN` | — | — | Extra service token |
| `GENERIC_TIMEZONE` | — | `America/Los_Angeles` | IANA timezone |

## Integration with lab-config.yaml

The root `lab-config.yaml` already references this n8n instance:

```yaml
automation:
  n8n:
    enabled: true
    base_url_env: "N8N_BASE_URL"   # e.g. http://54.209.8.126:5678
    api_key_env: "N8N_API_KEY"
```

On your host / EC2, export:

```bash
export N8N_BASE_URL="http://localhost:5678"   # or your EC2 public IP
export N8N_API_KEY="your-custom-key"
```

## Using Credentials Inside n8n

n8n does **not** enforce a single global API key. Instead:

1. **External API credentials** — create them in the n8n UI under *Settings → Credentials*.
2. **Environment variables** — reference them in any workflow node as `{{$env.N8N_API_KEY}}`, `{{$env.MY_SERVICE_TOKEN}}`, etc.

## Useful Commands

```bash
docker compose up -d          # start
docker compose down           # stop
docker compose logs -f n8n    # tail logs
docker compose pull && docker compose up -d   # upgrade n8n
```
