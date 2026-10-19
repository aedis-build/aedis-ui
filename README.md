# Aedis UI

Secure-by-default React components for building AI platforms: agent chat, approvals, hand raises, usage ceilings, workflow editors and the app shell around them.

Aedis UI follows the [shadcn/ui](https://ui.shadcn.com) model: components are not a dependency you install, they are source code you add to your app and own. The registry is compatible with the shadcn CLI.

> Status: early preview. The registry, docs site and first components are being proposed through pull requests.

## Usage

Add the Aedis registry to your app's `components.json` once:

```json
{
  "registries": {
    "@aedis": "https://aedis-build.github.io/aedis-ui/r/{name}.json"
  }
}
```

Then add components with the shadcn CLI:

```bash
npx shadcn@latest add @aedis/button
```

The first component brings the theme (`@aedis/theme`). Import it once in your global CSS, after Tailwind:

```css
@import "tailwindcss";
@import "./styles/aedis-theme.css";
```

Aedis items depend only on other Aedis items (including its own `@aedis/utils`), so an install never pulls a package that Aedis did not choose.

## Security

Every component defends its own sink: agent and user text is rendered as data, text fields are bounded by default, the backend is reached only same-origin, and hidden code points never travel between a person and an agent. The repository meets level L3 of the Aedis Platform conformance levels. How each attack is treated, what the UI leaves to the backend, and the checklist for an app built with these components are in [docs/SECURITY-BY-CONSTRUCTION.md](docs/SECURITY-BY-CONSTRUCTION.md).

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache-2.0](LICENSE), like the rest of [Aedis](https://github.com/aedis-build/aedis).
