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

  const description = repo.description
    ? `<p class="repo-description">${repo.description}</p>`
    : "";
  const language = repo.language
    ? `<span>lang ${repo.language}</span>`
    : "";
  const archived = repo.archived ? "<span>archived</span>" : "";
  const fork = repo.fork ? "<span>fork</span>" : "";

  item.innerHTML = `
    <a class="repo-link" href="${repo.html_url}">${repo.name}</a>
    ${description}
    <div class="repo-meta">
      ${language}
      ${fork}
      ${archived}
      <span>updated ${formatDate(repo.pushed_at)}</span>
    </div>
  `;

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
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`
    );

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const repos = await response.json();

    repoCount.textContent = `${repos.length} repos`;
    repoList.replaceChildren(...repos.map(renderRepo));

    if (repos.length === 0) {
      showStatus("No public repositories found.");
      return;
    }

    hideStatus();
  } catch (error) {
    repoCount.textContent = "unavailable";
    showStatus("Could not load repositories right now. Please try again later.");
  }
}

loadRepositories();

