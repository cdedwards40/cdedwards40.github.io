var github_user = "cdedwards40";

async function createCards() {
  let response = await fetch(`https://api.github.com/users/${github_user}/repos`);
  let data = await response.json();

  // filter out projects that are forked and the main *.github.io pages project
  let projects = data.filter(x => !x.fork).filter(x => !x.name.endsWith("github.io")).map(async p => {
    let project = {
      "url": p.html_url,
      "name": null,
      "repo": p.name,
      "description": null,
      "lastUpdate": p.updated_at,
      "img": null
    }

    // update name and description
    let response = await fetch(`https://api.github.com/repos/${github_user}/${project.repo}/readme`)
    if (response.ok) {
      let data = await response.json();
      let readme = atob(data.content);
      let lines = readme
        .replaceAll("\r", "\n")       // make line breaks consistent
        .split("\n")                  // split into array of lines
        .filter(x => x.length)        // filter empty lines
        .map(x => x.trim());          // trim any white space on ends

      // find name of project by getting first line that starts with # (heading)
      // assume next line after the title is the summary
      for (let i=0; i<lines.length; i++) {
        if (lines[i].startsWith("# ")) {
          project.name = lines[i].slice(1, lines[i].length).trim();
          project.description = lines[i+1].trim();
          break;
        }
      }
    } else {
      console.log(`\'${project.repo}\' does not contain a REAMDE file`)
      project.name = project.repo
    }

    // update name and description
    try {
      response = await fetch(`https://api.github.com/repos/${github_user}/${project.repo}/contents/thumbnail.png`)
      if (response.ok) {
        let data = await response.json();
        project.img = "data:image/png;base64," + data.content.replaceAll("\n","");
      } else {
        console.log(`\'${project.repo}\' does not contain a thumbnail image`)
        project.img = null;
      }
    } catch (error) {
      console.log(error)
    }
    
    // generate HTML for element
    document.getElementById("projectCardDiv").innerHTML += cardHtml(project)
    
  })
}

function cardHtml(p) {

  let cardImg = `<img src=${p.img} class="card-img-top" />` || `<svg class="bd-placeholder-img card-img-top" width="100%" height="225" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder: Thumbnail" preserveAspectRatio="xMidYMid slice" focusable="false"><title>Placeholder</title><rect width="100%" height="100%" fill="#55595c"/><text x="50%" y="50%" fill="#eceeef" dy=".3em">${p.name}</text></svg>`

  return `
<div class="col">
  <div class="card shadow-sm">
  ${cardImg}
    <div class="card-body">
      <h6 class="card-title">${p.name}</h6>
      <p class="card-text">${p.description || "No summary availible"}</p>
      <div class="d-flex justify-content-between align-items-center">
        <div class="btn-group">
          <a class="btn btn-sm btn-outline-secondary" href="${p.url}">View</a>
        </div>
        <small class="text-body-secondary">updated ${p.lastUpdate.slice(0,10)}</small>
      </div>
    </div>
  </div>
</div>
`
}

createCards()