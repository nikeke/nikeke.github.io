# nikeke.github.io

Minimal Jekyll-based GitHub Pages site for listing repositories.

## Local development

```bash
bundle install
bundle exec jekyll serve
```

## Search engine readiness

- `https://nikeke.github.io/robots.txt`
- `https://nikeke.github.io/sitemap.xml`
- Repository listings are rendered from `/_data/repositories.yml` so crawlers can index them without executing JavaScript.
