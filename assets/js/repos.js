const repoList = document.getElementById("repo-list");
const status = document.getElementById("status");
const repoCount = document.getElementById("repo-count");
const username = window.NIKEKE_SITE && window.NIKEKE_SITE.username;

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function showStatus(message) {
  status.textContent = message;
  status.hidden = false;
}

function hideStatus() {
  status.hidden = true;
}

function renderRepo(repo) {
  const item = document.createElement("li");
  item.className = "repo-item";

  const link = document.createElement("a");
  link.className = "repo-link";
  link.href = repo.html_url;
  link.textContent = repo.name;

  const meta = document.createElement("div");
  meta.className = "repo-meta";

  if (repo.language) {
    const language = document.createElement("span");
    language.textContent = `lang ${repo.language}`;
    meta.appendChild(language);
  }

  if (repo.fork) {
    const fork = document.createElement("span");
    fork.textContent = "fork";
    meta.appendChild(fork);
  }

  if (repo.archived) {
    const archived = document.createElement("span");
    archived.textContent = "archived";
    meta.appendChild(archived);
  }

  const updated = document.createElement("span");
  updated.textContent = `updated ${formatDate(repo.pushed_at)}`;
  meta.appendChild(updated);

  item.appendChild(link);

  if (repo.description) {
    const description = document.createElement("p");
    description.className = "repo-description";
    description.textContent = repo.description;
    item.appendChild(description);
  }

  item.appendChild(meta);

  return item;
}

async function loadRepositories() {
  if (!username) {
    repoCount.textContent = "0 repos";
    showStatus("No GitHub username configured.");
    return;
  }

  showStatus("Connecting to GitHub...");

  try {
    const repos = [];
    let page = 1;

    while (true) {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&page=${page}`
      );

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const pageRepos = await response.json();
      repos.push(...pageRepos);

      if (pageRepos.length < 100) {
        break;
      }

      page += 1;
    }

    repoCount.textContent = `${repos.length} repos`;
    repoList.replaceChildren(...repos.map(renderRepo));

    if (repos.length === 0) {
      showStatus("No public repositories found.");
      return;
    }

    hideStatus();
  } catch (error) {
    console.error(error);
    repoCount.textContent = "unavailable";
    showStatus("Could not load repositories right now. Please try again later.");
  }
}

loadRepositories();
