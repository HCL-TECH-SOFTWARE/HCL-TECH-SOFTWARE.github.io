# HCLSoftware Open Source

This is a dependency-free static catalogue of public HCLSoftware GitHub repositories. GitHub Pages serves plain HTML, CSS, JavaScript, images, fonts, and committed JSON data.

The site does not call the GitHub API in visitors' browsers. It has no Jekyll, Ruby gems, npm packages, Bootstrap, jQuery, or third-party runtime resources.

## Structure

- `index.html` lists every public repository.
- Product HTML pages filter the same `data/repositories.json` file in place.
- `assets/js/site.js` contains the Web Components that render the header, filters, and repository cards.
- `assets/css/site.css` contains the complete responsive stylesheet.
- `scripts/refresh-catalogue.mjs` refreshes the committed catalogue data.

## Refreshing repository data

The trusted `Refresh repository catalogue` GitHub workflow runs weekly and can be started manually. It queries the GitHub GraphQL API with the short-lived workflow token, retains public repositories only, and commits changes to `data/repositories.json`.

The workflow must run only from the protected default branch. Pull-request workflows must not receive its token, write permission, or deployment permission.

To run the refresh script locally, use a GitHub token that can read the public organisation data:

```sh
GITHUB_TOKEN=... node scripts/refresh-catalogue.mjs
```

The script uses only Node's standard library.

## Local preview

Use any static HTTP server from the repository root. For example:

```sh
python3 -m http.server
```

Open `http://localhost:8000/`. Opening the HTML files directly will not load the catalogue because browsers restrict local `fetch()` requests.

## Security rules

- Repository metadata is rendered with DOM APIs and `textContent`, never HTML parsing.
- Cards accept only HTTPS URLs under `github.com/HCL-TECH-SOFTWARE/`.
- The browser loads scripts, styles, fonts, images, and data only from the site origin.
- The pages include a restrictive Content Security Policy.
