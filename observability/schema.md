# Observability Event Schema

An OpenTelemetry-compatible event schema for structured observability across all apps built from `fullstack-template`.

## Core Attributes

Every log entry and trace span should include these fields:

| Attribute | Type | Source | Description |
|-----------|------|--------|-------------|
| `traceId` | `string` | Auto-generated | W3C Trace Context trace ID |
| `spanId` | `string` | Auto-generated | W3C Trace Context span ID |
| `requestId` | `string` | Middleware | Unique per-request ID (UUID v4), propagated via `X-Request-Id` header |
| `timestamp` | `string` | Runtime | ISO 8601 timestamp |
| `service.name` | `string` | Config | App identifier (e.g., `inventory-lab-app-api`) |
| `service.version` | `string` | Config | Semver or git SHA |
| `environment` | `string` | Env var | `development`, `staging`, `production` |

## Request Log Schema

Emitted by the request-logging middleware on every HTTP response:

```json
{
  "level": "info",
  "timestamp": "2026-03-11T22:50:00.000Z",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "service": { "name": "api-node", "version": "1.0.0" },
  "environment": "production",
  "http": {
    "method": "POST",
    "url": "/api/orders",
    "statusCode": 201,
    "durationMs": 142,
    "userAgent": "Mozilla/5.0 ...",
    "remoteAddr": "192.168.1.1"
  },
  "user": {
    "id": "usr_abc123"
  }
}
```

## Error Log Schema

Emitted on unhandled errors or explicit error logging:

```json
{
  "level": "error",
  "timestamp": "2026-03-11T22:50:01.000Z",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "service": { "name": "api-node", "version": "1.0.0" },
  "environment": "production",
  "error": {
    "message": "Foreign key constraint violation",
    "name": "DatabaseError",
    "stack": "..."
  },
  "http": {
    "method": "POST",
    "url": "/api/orders",
    "statusCode": 500
  }
}
```

## Metrics

Basic metrics to track per endpoint:

| Metric | Type | Unit | Description |
|--------|------|------|-------------|
| `http.server.request.duration` | Histogram | ms | Request-to-response latency |
| `http.server.request.count` | Counter | — | Total requests by method + route + status |
| `http.server.error.count` | Counter | — | Requests with status ≥ 400 |

## PII Rules

- **Never log**: email, phone, password, address, SSN, tokens, API keys.
- **Allowed**: user ID, session ID, organization ID, hashed identifiers.
- **Request bodies**: strip or redact sensitive fields before logging. Default: do not log request bodies.

## Integration with OpenTelemetry

For full distributed tracing, add the `@opentelemetry/sdk-node` package and configure:

1. **Traces** → export to Jaeger, Zipkin, or OTLP collector.
2. **Metrics** → export to Prometheus or OTLP collector.
3. **Logs** → structured JSON to stdout, collected by Fluentd/Vector/CloudWatch.

The middleware in `apps/api-node/src/app.js` provides the baseline. Layer OpenTelemetry SDK on top when ready for full distributed tracing.
