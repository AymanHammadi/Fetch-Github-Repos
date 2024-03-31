let theInput = document.querySelector(".get-repos input");
let getButton = document.querySelector('.get-button');
let reposData = document.querySelector('.show-data');

getButton.onclick = function () {
  getRepos();
}

// Get Repos Function
async function getRepos() {
  console.log("Hello")
  if (theInput.value == "") {
    reposData.innerHTML = "<span>Please Write Github Username.</span>"
  } else {
    try {
      // Get user data
      let response = await fetch(`https://api.github.com/users/${theInput.value}`);
      let userData = await response.json();
      // Check if user exists
      if (userData.message === 'Not Found') {
        reposData.innerHTML = "<span>User Not Found.</span>";
      } else {
        // Get repos data
        let reposResponse = await fetch(userData.repos_url);
        let repositoriesData = await reposResponse.json();
        // Clear previous data
        reposData.innerHTML = "";
        // Loop through repos and display names
        repositoriesData.forEach(repo => {
          console.log(repo.name)
          let mainDiv = document.createElement("div");
          let repoName = document.createTextNode(repo.name);

          mainDiv.appendChild(repoName);

          let theURL = document.createElement("a");
          let theURLText = document.createTextNode("Visit");

          theURL.appendChild(theURLText);

          theURL.href = `https:/github.com/${theInput.value}/${repo.name}`

          theURL.setAttribute('target', `_blank`);

          mainDiv.appendChild(theURL);

          let starsSpan = document.createElement("span");
          let starsText = document.createTextNode(`Stars ${repo.stargazers_count}`);

          starsSpan.appendChild(starsText);

          mainDiv.appendChild(starsSpan);

          mainDiv.className = "repo-box";

          reposData.appendChild(mainDiv);
        });
      }
    } catch (error) {
      // Handle errors
      reposData.innerHTML = "<span>Error occurred during request.</span>";
      console.error('Error:', error);
    }
  }
}
