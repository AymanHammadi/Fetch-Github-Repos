const theInput = document.querySelector(".get-repos input");
const getButton = document.querySelector(".get-button");
const reposData = document.querySelector(".show-data");

// Debounce function to limit API calls
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Event listeners
getButton.onclick = () => getRepos();
theInput.addEventListener(
  "input",
  debounce(() => getRepos(), 500)
);

async function getRepoLanguages(languagesUrl) {
  const response = await fetch(languagesUrl);
  return await response.json();
}

async function getRepos() {
  if (!theInput.value.trim()) {
    showError("Please Write Github Username.");
    return;
  }

  showLoading(true);

  try {
    // Get user data
    const response = await fetch(
      `https://api.github.com/users/${theInput.value}`
    );
    const userData = await response.json();

    if (response.status === 403) {
      throw new Error("API rate limit exceeded. Please try again later.");
    }

    if (userData.message === "Not Found") {
      throw new Error("User Not Found.");
    }

    // Get repos data
    const reposResponse = await fetch(
      `${userData.repos_url}?sort=updated&per_page=100`
    );
    const repositoriesData = await reposResponse.json();

    displayRepos(repositoriesData);
  } catch (error) {
    showError(error.message || "Error occurred during request.");
    console.error("Error:", error);
  } finally {
    showLoading(false);
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

    // Get repository languages
    const languages = await getRepoLanguages(repo.languages_url);
    const languagesHtml = Object.keys(languages)
      .map((lang) => `<span class="language-tag">${lang}</span>`)
      .join("");

    mainDiv.innerHTML = `
      <h3 class="repo-name">${repo.name}</h3>
      ${
        repo.description
          ? `<p class="repo-description">${repo.description}</p>`
          : ""
      }
      <div class="repo-stats">
        <span class="stars">⭐ ${repo.stargazers_count}</span>
        <span class="forks">🔱 ${repo.forks_count}</span>
        <span class="size">📦 ${(repo.size / 1024).toFixed(2)} MB</span>
      </div>
      <div class="languages">${languagesHtml}</div>
      <div class="repo-meta">
        <span>Created: ${new Date(repo.created_at).toLocaleDateString()}</span>
        <span>Last updated: ${new Date(
          repo.updated_at
        ).toLocaleDateString()}</span>
      </div>
      <a href="${
        repo.html_url
      }" target="_blank" class="repo-link">View Repository</a>
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
