# Google Analytics GA4 MCP

This plugin adds a local MCP server so Codex can send `Google Analytics 4` events through the `Measurement Protocol`.

## Environment variables

Set these before using the MCP server:

- `GA4_MEASUREMENT_ID`
- `GA4_API_SECRET`
- `GA4_CLIENT_ID` optional

You can find the first two in:

`Google Analytics -> Admin -> Data streams -> Measurement Protocol API secrets`

## Tools

- `validate_ga4_config`
- `track_ga4_event`

## Example event

Use `track_ga4_event` with:

```json
{
  "eventName": "cta_click",
  "clientId": "github-pages-demo.1",
  "params": {
    "location": "hero",
    "label": "start_tracking"
  }
}
```

## Notes

- This is separate from the browser tag in `index.html`.
- Browser analytics tracks real page visits.
- This MCP server is useful for test events, server-side events, or Codex-driven automations.
