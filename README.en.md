<div align="center">
  <img src="dist/logo.svg" alt="Remanga Enhanced" width="96" height="96">
  <h1>Remanga Enhanced</h1>
  <p>A browser userscript for a more customizable ReManga experience.</p>
  <p>
    <a href="https://github.com/dev-leva1/remanga-ext/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/dev-leva1/remanga-ext?style=flat-square&color=2563eb"></a>
    <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/github/license/dev-leva1/remanga-ext?style=flat-square"></a>
  </p>
  <p><a href="https://raw.githubusercontent.com/dev-leva1/remanga-ext/main/dist/remanga-extension.user.js"><strong>Install userscript</strong></a> · <a href="https://github.com/dev-leva1/remanga-ext/releases">Releases</a> · <a href="README.md">Русский</a></p>
</div>

## Features

- Bulk chapter read marking and likes, with progress reporting.
- Optional automatic likes and chapter comments (disabled by default).
- Profile and header customization, guild highlighting and user tooltips.
- Random title navigation and full-screen cover previews.
- Settings, local action statistics and update checks.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) for Chrome, Edge or Firefox, or [Stay](https://apps.apple.com/us/app/stay-for-safari/id1591620171) for Safari.
2. Open the [userscript installer](https://raw.githubusercontent.com/dev-leva1/remanga-ext/main/dist/remanga-extension.user.js) and confirm installation.
3. Sign in to [ReManga](https://remanga.org/) and use the extension settings button in the site header.

The userscript interface and detailed documentation are primarily in Russian. Installation and update checks use the same built userscript from the `main` branch via GitHub Raw. GitHub Releases preserve versioned snapshots. Users upgrading from versions before v1.8.1 should open the new installer once and confirm an update of their existing script. Do not uninstall the old script first; check that the manager recognizes the existing installation.

## Development

```bash
git clone https://github.com/dev-leva1/remanga-ext.git
cd remanga-ext
npm ci
npm run lint
npm run build
node --check dist/remanga-extension.user.js
```

The built script is `dist/remanga-extension.user.js`. The Telegram feedback bot is a separate Node.js/PostgreSQL service.

See the [documentation index](docs/README.md), [developer guide](docs/DEVELOPER_GUIDE.md), [architecture](docs/ARCHITECTURE.md), [data and permissions](docs/PRIVACY.md), [changelog](CHANGELOG.md) and [contribution guide](CONTRIBUTING.md).

## Feedback and security

Report bugs or suggest features through [GitHub Issues](https://github.com/dev-leva1/remanga-ext/issues/new/choose) or the [Telegram feedback bot](https://t.me/remanga_extension_bot). See [SECURITY.md](SECURITY.md) for vulnerability reporting. Do not share credentials or private data.

## License

[MIT](LICENSE) for original project code; [third-party notices](THIRD_PARTY_NOTICES.md) apply to bundled external components.

Remanga Enhanced is an independent project, not an official ReManga product. Follow the platform's rules. Rate limits do not guarantee protection from account restrictions. Do not use automated actions for spam.
