# Website metrics

Provider: GoatCounter, a free hosted option for reasonable public/noncommercial usage.
Official docs: https://www.goatcounter.com/help/start and https://www.goatcounter.com/help/privacy.

## Activate

1. Create your own account at https://www.goatcounter.com/signup with site domain `sbrunwas.github.io`.
2. Put the account's public code (the part before `.goatcounter.com`) in `assets/analytics.json`.
   An empty code disables the integration and makes no requests to GoatCounter.
3. Publish that file to the website's `master` branch. GitHub Pages deploys it.
4. Open `https://YOUR-CODE.goatcounter.com` and sign in to see the dashboard.
5. Visit the website with tracking protection disabled for the test visit, then check the dashboard.
   Do Not Track / Global Privacy Control requests are excluded. Ad blockers can prevent counting.

The public code and tracking endpoint are not credentials. Never put passwords or API tokens in this repo.
Keep dashboard visibility private in GoatCounter's settings.
Statistics begin at activation; previous visits cannot be recovered from this script.

## Coverage

- Jekyll homepage, About, Posts, Tags, project pages, and individual posts.
- Public `/vaccines/`, `/ghostnet/`, `/clawstudio/`, and the ClawStudio instrument pages.
- Six homepage button events: About, Posts, Pediatric Residency Notes, Milestones, Vaccines, and Fever.
- Test fixtures, original reference pages, the old ClawStudio preview, localhost, and the private
  ChatGPT Sites hostname are excluded.

Page views, visitors, referring origins, and device/browser summaries appear in GoatCounter.
Homepage events have names such as `home-vaccines`. Clicking a link is measured on this website;
usage after arriving at an external app is not measured without separately integrating that app.

The loader deliberately strips query strings and fragments and reduces referrers to their origin.
It never reads form controls, patient ages, application state, file uploads, or clicked URLs.
GoatCounter's automatic page/event tracking is disabled; only the explicit page view and labelled
homepage events are sent. The provider does not store visitor cookies; its own account login uses cookies.
Privacy/blocking choices mean visitor counts are estimates, not an exact census.

## Maintenance

Shared loader: `assets/js/site-analytics.js`. Public account setting: `assets/analytics.json`.
Jekyll loads it via `_includes/head.html`; standalone pages have one deferred script tag.
The vaccine Sites staging helper includes the loader, which exits immediately on that host.
If a publishing workflow overwrites standalone HTML, retain/reapply its analytics script tag.

Run `node tests/site-analytics.cjs` and `node --check assets/js/site-analytics.js` before publishing changes.
