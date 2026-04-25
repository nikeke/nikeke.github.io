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

## Automatic repository refresh

`_data/repositories.yml` is kept current by the
**[Refresh repository list](.github/workflows/update-repos.yml)** GitHub
Actions workflow, which runs:

- **Daily at 03:00 UTC** (scheduled cron).
- **On every push to `main`** that touches `_config.yml`,
  `scripts/fetch_repositories.py`, or the workflow file itself.
- **On demand** via the *workflow_dispatch* trigger in the GitHub Actions UI.

The workflow calls `scripts/fetch_repositories.py`, which queries the GitHub
REST API (`/users/{owner}/repos`) using the built-in `GITHUB_TOKEN` and
regenerates `_data/repositories.yml` with the fields used by `index.html`:
`name`, `html_url`, `description`, `language`, `fork`, `archived`,
`pushed_at`.  A new commit is created only when the file actually changes, so
the history stays clean.

To change the owner, update `repository_owner` in `_config.yml`.

### Run the script locally

```bash
GITHUB_TOKEN=<your_pat> python scripts/fetch_repositories.py nikeke
```
