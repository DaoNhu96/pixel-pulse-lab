# GA4 Test Site for GitHub Pages

This is a minimal static site for learning `Google Analytics 4` on top of `GitHub Pages`.

## What it tracks

- `page_view` from the GA4 site tag
- `cta_click` from the main button
- `form_submit` from the sample form

## Included MCP bridge

This workspace also includes a local Codex plugin at `plugins/google-analytics-ga4`.

It exposes two MCP tools:

- `validate_ga4_config`
- `track_ga4_event`

That bridge is for server-side or Codex-triggered GA4 events. It is separate from the browser tag used by the website.

## Add your GA4 Measurement ID

Update `G-XXXXXXXXXX` in these files:

- `index.html`
- `script.js`

You will get the Measurement ID from:

`Google Analytics -> Admin -> Data streams -> Web stream`

It looks like `G-ABC123DEF4`.

## Run locally

You can open `index.html` directly in a browser for a quick UI check.

## Deploy to GitHub Pages

1. Create a GitHub repository named `<your-username>.github.io` if you want a user site, or any repo name for a project site.
2. Upload these files to the repository root.
3. In GitHub, open `Settings -> Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Select your branch, usually `main`, and the root folder.
6. Wait a few minutes for publish to finish.

Official docs:

- [GitHub Pages quickstart](https://docs.github.com/en/pages/quickstart)

## Verify GA4

1. Open your published site.
2. Click `Start Tracking`.
3. Submit the form.
4. In GA4, open `Reports -> Realtime`.
5. Confirm you see activity and your custom events.

## Notes

- Until you replace `G-XXXXXXXXXX`, the page will not send data to GA4.
- Before the ID is configured, custom events are logged to the browser console so you can still test the page behavior.
