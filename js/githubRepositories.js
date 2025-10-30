
async function loadRepos() {
    const res = await fetch('https://api.github.com/users/jalaljaleh/repos?per_page=10');
    const repos = await res.json();

    return repos.filter(r => !r.fork).map(r => ({
        title: r.name,
        description: r.description,
        url: r.html_url,
        language: r.language
    }));
}
export async function renderProjects() {
    const projectsList = document.getElementById('projectslist');
    const repos = await loadRepos();

    repos.forEach(repo => {
        const row = document.createElement('div');
        row.className = 'project-row';

        row.innerHTML = `
      <span class="project-label">
          <a href="${repo.url}" target="_blank" rel="noopener"> ${repo.title}</a>
      </span>

      <span class="project-description">
        ${repo.description ? repo.description : ''} 
        ${repo.language || 'Other'}
      </span>
    `;


        projectsList.appendChild(row);
    });
}