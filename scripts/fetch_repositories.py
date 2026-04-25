#!/usr/bin/env python3
"""Fetch public repositories for a GitHub user and write _data/repositories.yml.

Usage:
    python scripts/fetch_repositories.py <owner>

The script reads the GitHub API (unauthenticated or via GITHUB_TOKEN env var)
and writes _data/repositories.yml with the fields used by index.html:
  name, html_url, description, language, fork, archived, pushed_at
"""

import json
import os
import re
import sys
import urllib.request
import urllib.error


def fetch_repos(owner: str) -> list[dict]:
    """Return all public repos for *owner*, handling pagination."""
    token = os.environ.get("GITHUB_TOKEN", "")
    headers = {"Accept": "application/vnd.github+json",
               "X-GitHub-Api-Version": "2022-11-28"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    repos: list[dict] = []
    page = 1
    while True:
        url = (
            f"https://api.github.com/users/{owner}/repos"
            f"?type=owner&per_page=100&page={page}"
        )
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req) as resp:
                batch = json.loads(resp.read())
        except urllib.error.HTTPError as exc:
            print(f"GitHub API error {exc.code}: {exc.reason}", file=sys.stderr)
            sys.exit(1)

        if not batch:
            break
        repos.extend(batch)
        page += 1

    return repos


# Characters that require a YAML string to be quoted (per YAML 1.1/1.2 spec).
_YAML_SPECIAL_CHARS = set(':#{}[]|>&*!,\'"%@`')

# YAML bare-word scalars that would be interpreted as non-string types.
_YAML_RESERVED_WORDS = {
    "true", "false", "null", "~",
    "yes", "no", "on", "off",  # YAML 1.1 booleans
}

# Regex for values that look like integers or floats and must be quoted.
_YAML_NUMBER_RE = re.compile(
    r"^[-+]?(?:0x[0-9a-fA-F]+|0o[0-7]+|0b[01]+|[0-9]+(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\.inf|\.nan)$",
    re.IGNORECASE,
)


def to_yaml_value(value) -> str:
    """Serialise a single scalar value to an inline YAML representation."""
    if value is None or value == "":
        return '""'
    if isinstance(value, bool):
        return "true" if value else "false"
    # Strings: quote when necessary to avoid misinterpretation by a YAML parser.
    s = str(value)
    need_quotes = (
        bool(_YAML_SPECIAL_CHARS.intersection(s))
        or s.lower() in _YAML_RESERVED_WORDS
        or bool(_YAML_NUMBER_RE.match(s))
    )
    if need_quotes:
        escaped = s.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return s


def repos_to_yaml(repos: list[dict]) -> str:
    """Serialise *repos* list to a YAML string compatible with Jekyll's data."""
    lines: list[str] = []
    for repo in repos:
        description = repo.get("description") or ""
        language = repo.get("language") or ""
        lines.append(f"- name: {to_yaml_value(repo['name'])}")
        lines.append(f"  html_url: {to_yaml_value(repo['html_url'])}")
        lines.append(f"  description: {to_yaml_value(description)}")
        lines.append(f"  language: {to_yaml_value(language)}")
        lines.append(f"  fork: {to_yaml_value(repo['fork'])}")
        lines.append(f"  archived: {to_yaml_value(repo['archived'])}")
        lines.append(f"  pushed_at: {to_yaml_value(repo['pushed_at'])}")
    return "\n".join(lines) + "\n"


def main() -> None:
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <owner>", file=sys.stderr)
        sys.exit(1)

    owner = sys.argv[1]
    repos = fetch_repos(owner)
    # Keep only public repos (the API already filters by type=owner but may
    # include private ones when authenticated; exclude them explicitly).
    repos = [r for r in repos if not r.get("private", False)]

    yaml_content = repos_to_yaml(repos)

    # Resolve path relative to the repo root regardless of cwd.
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    out_path = os.path.join(repo_root, "_data", "repositories.yml")

    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(yaml_content)

    print(f"Wrote {len(repos)} repositories to {out_path}")


if __name__ == "__main__":
    main()
