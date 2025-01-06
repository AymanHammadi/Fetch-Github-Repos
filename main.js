const theInput = document.querySelector(".get-repos input");
const getButton = document.querySelector(".get-button");
const reposData = document.querySelector(".show-data");
const tokenToggle = document.querySelector("#useToken");
const tokenInput = document.querySelector("#tokenInput");
const tokenToggleBtn = document.querySelector("#tokenToggleBtn");
const tokenPopup = document.querySelector(".token-popup");

// Load saved token if exists
const savedToken = localStorage.getItem("github_token");
if (savedToken) {
  tokenInput.value = savedToken;
  tokenToggle.checked = true;
}

// Token popup toggle
tokenToggleBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  tokenPopup.style.display =
    tokenPopup.style.display === "none" ? "block" : "none";
});

// Close popup when clicking outside
document.addEventListener("click", (e) => {
  if (!tokenPopup.contains(e.target) && e.target !== tokenToggleBtn) {
    tokenPopup.style.display = "none";
  }
});

// Token toggle handler
tokenToggle.addEventListener("change", () => {
  if (!tokenToggle.checked) {
    localStorage.removeItem("github_token");
  }
});

// Save token when entered
tokenInput.addEventListener("change", () => {
  if (tokenInput.value.trim()) {
    localStorage.setItem("github_token", tokenInput.value.trim());
  } else {
    localStorage.removeItem("github_token");
  }
});

// Event listeners for search
getButton.onclick = () => getRepos();
theInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    getRepos();
  }
});

async function fetchGithubAPI(url) {
  const headers = {
    Accept: "application/vnd.github.v3+json",
  };

  // Add token if available and enabled
  if (tokenToggle.checked && tokenInput.value.trim()) {
    headers.Authorization = `Bearer ${tokenInput.value.trim()}`;
  }

  const response = await fetch(url, { headers });

  if (response.status === 403) {
    throw new Error("API rate limit exceeded. Please try again later.");
  }

  if (response.status === 404) {
    throw new Error("User not found.");
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

async function getRepos() {
  if (!theInput.value.trim()) {
    showError("Please Write Github Username.");
    return;
  }

  showLoading(true);

  try {
    // Get user data
    const userData = await fetchGithubAPI(
      `https://api.github.com/users/${encodeURIComponent(theInput.value)}`
    );

    // Get repos data
    const repositoriesData = await fetchGithubAPI(
      `https://api.github.com/users/${encodeURIComponent(
        theInput.value
      )}/repos?sort=updated&per_page=100`
    );

    displayRepos(repositoriesData);
  } catch (error) {
    showError(error.message || "Error occurred during request.");
    console.error("Error:", error);
  } finally {
    showLoading(false);
  }
}

async function getRepoLanguages(languagesUrl) {
  try {
    const languages = await fetchGithubAPI(languagesUrl);
    const total = Object.values(languages).reduce((a, b) => a + b, 0);
    return Object.entries(languages).map(([name, bytes]) => ({
      name,
      percentage: ((bytes / total) * 100).toFixed(1),
    }));
  } catch (error) {
    console.error("Error fetching languages:", error);
    return [];
  }
}

function displayRepos(repositories) {
  reposData.innerHTML = "";

  if (repositories.length === 0) {
    showError("This user has no public repositories.");
    return;
  }

  repositories.forEach(async (repo) => {
    const mainDiv = document.createElement("div");
    mainDiv.className = "repo-box";

    // Get repository languages with percentages
    const languages = await getRepoLanguages(repo.languages_url);
    const languagesHtml = languages
      .map(
        (lang) => `
        <span class="language-tag">
          ${lang.name}
          <span class="language-percentage">${lang.percentage}%</span>
        </span>
      `
      )
      .join("");

    mainDiv.innerHTML = `
      <h3 class="repo-name">${repo.name}</h3>
      ${
        repo.description
          ? `<p class="repo-description">${repo.description}</p>`
          : ""
      }
      <div class="repo-stats">
        <span>
          <i class="fa-regular fa-star"></i> ${repo.stargazers_count}
          <span class="tooltip">Stars</span>
        </span>
        <span>
          <i class="fa-solid fa-code-fork"></i> ${repo.forks_count}
          <span class="tooltip">Forks</span>
        </span>
        <span>
          <i class="fa-solid fa-hard-drive"></i> ${(repo.size / 1024).toFixed(
            2
          )} MB
          <span class="tooltip">Repository Size</span>
        </span>
      </div>
      <div class="languages">${languagesHtml}</div>
      <div class="repo-meta">
        <span>
          <i class="fa-regular fa-calendar"></i>
          Created: ${new Date(repo.created_at).toLocaleDateString()}
        </span>
        <span>
          <i class="fa-solid fa-clock-rotate-left"></i>
          Last updated: ${new Date(repo.updated_at).toLocaleDateString()}
        </span>
      </div>
      <a href="${repo.html_url}" target="_blank" class="repo-link">
        <i class="fa-solid fa-arrow-up-right-from-square"></i>
        &nbsp; View Repository
      </a>
    `;

    reposData.appendChild(mainDiv);
  });
}

function showError(message) {
  reposData.innerHTML = `<div class="error-message">${message}</div>`;
}

function showLoading(isLoading) {
  getButton.disabled = isLoading;
  if (isLoading) {
    reposData.innerHTML = '<div class="loading">Loading repositories...</div>';
  }
}
