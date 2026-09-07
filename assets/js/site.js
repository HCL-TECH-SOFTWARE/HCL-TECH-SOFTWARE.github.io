const PRODUCTS = [
  ["appscan", "AppScan", "HCL AppScan", "Fast, Accurate, Agile Security Testing"],
  ["connections", "Connections", "HCL Connections", "People Power Your Business. Connections Powers Your People"],
  ["domino", "Domino", "HCL Domino", "Domino. Apps that Run Your Business."],
  ["dx", "hcl-dx", "HCL DX", "HCL Digital Experience Leads in the SPARK Matrix"],
  ["leap", "hcl-leap", "HCL Leap", "Build Sophisticated Web Applications in Minutes"],
  ["onetest", "hcl-onetest", "HCL OneTest", "Speed innovation with continuous testing across the enterprise"],
  ["model-realtime", "model-realtime", "HCL Model RealTime", "Meet the only tool you need to develop stateful, event-driven and real-time applications."],
  ["sametime", "sametime", "HCL Sametime", "Your Meeting. Your Data. Double the Value"],
  ["volt-mx", "volt-mx", "HCL Volt MX", "Beautiful Apps. Transformation Delivered."],
  ["workloadAutomation", "hcl-workload-automation", "HCL Workload Automation", "People Power Your Business. Connections Powers Your People"]
];

const LANGUAGE_CLASSES = new Map([
  ["C++", "language-cpp"], ["JavaScript", "language-javascript"],
  ["TypeScript", "language-typescript"], ["HTML", "language-html"],
  ["CSS", "language-css"], ["Python", "language-python"], ["Xtend", "language-xtend"],
  ["Java", "language-java"], ["C", "language-c"], ["C#", "language-csharp"],
  ["Jupyter Notebook", "language-jupyter-notebook"], ["Go", "language-go"],
  ["Shell", "language-shell"], ["PHP", "language-php"], ["Ruby", "language-ruby"],
  ["Perl", "language-perl"], ["Swift", "language-swift"],
  ["Objective-C", "language-objective-c"], ["Groovy", "language-groovy"],
  ["Scala", "language-scala"], ["WebAssembly", "language-webassembly"],
  ["Rust", "language-rust"], ["Jinja", "language-jinja"]
]);

function approvedRepositoryUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com" &&
      /^\/HCL-TECH-SOFTWARE\/[^/]+\/?$/.test(url.pathname) ? url.href : null;
  } catch {
    return null;
  }
}

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const items = PRODUCTS.map(([path, , name]) => `<li><a href="${path}.html">${name}</a></li>`).join("");
    this.innerHTML = `<header class="site-header">
      <div class="top-bar"><a href="https://www.hcltech.com/"><img src="images/HCL_git.png" alt="HCLSoftware"></a><a href="https://www.hcltech.com/" target="_blank" rel="noopener noreferrer">HCLTech</a></div>
      <div class="main-bar"><a class="brand" href="https://www.hcl-software.com/"><img src="images/HCLSW_git.svg" alt="HCLSoftware"></a>
        <a class="home-link" href="index.html">Open Source Repositories</a>
        <button class="products-toggle" type="button" aria-expanded="false" aria-controls="products-menu">Products</button>
      </div>
      <nav id="products-menu" class="products-menu" aria-label="Products" hidden><h2>Products</h2><ul>${items}</ul></nav>
    </header>`;
    const button = this.querySelector("button");
    const menu = this.querySelector("nav");
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      menu.hidden = expanded;
    });
  }
}

class RepositoryCatalogue extends HTMLElement {
  async connectedCallback() {
    this.productTopic = this.dataset.topic || "";
    this.selectedTopics = new Set();
    this.searchText = "";
    this.sortBy = "";
    this.renderShell();
    try {
      const response = await fetch(new URL("./data/repositories.json", document.baseURI));
      if (!response.ok) throw new Error(`Catalogue request failed: ${response.status}`);
      const records = await response.json();
      this.repositories = records.filter((record) => this.validRecord(record));
      this.availableRepositories = this.productTopic
        ? this.repositories.filter((record) => record.topics.includes(this.productTopic))
        : this.repositories;
      this.renderFilters();
      this.updateResults();
    } catch (error) {
      this.grid.replaceChildren(this.message("The repository catalogue is unavailable."));
      this.count.textContent = "0 repositories found";
      console.error(error);
    }
  }

  validRecord(record) {
    return record && typeof record.name === "string" && typeof record.description === "string" &&
      Array.isArray(record.topics) && typeof record.language === "string" &&
      typeof record.license === "string" && approvedRepositoryUrl(record.url);
  }

  renderShell() {
    this.innerHTML = `<section class="catalogue" aria-label="Repository catalogue">
      <label><span class="visually-hidden">Search repositories</span><input class="search" type="search" placeholder="Search repositories"></label>
      <div class="filter-header"><button class="filter-toggle" type="button" aria-expanded="false">Filter by topic</button><button class="reset" type="button">Reset search and filters</button></div>
      <div class="topic-list" hidden="true"></div>
      <div class="catalogue-status"><p class="repository-count" aria-live="polite"></p><label class="sort-control">Sort by: <select><option value="">Recently Updated</option><option value="name">Name</option><option value="topic">Topic</option><option value="language">Language</option><option value="license">License</option></select></label></div>
      <div class="repository-grid"></div></section>`;
    this.search = this.querySelector("input");
    this.topicList = this.querySelector(".topic-list");
    this.count = this.querySelector(".repository-count");
    this.grid = this.querySelector(".repository-grid");
    let timeout;
    this.search.addEventListener("input", () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => { this.searchText = this.search.value.trim().toLocaleLowerCase(); this.updateResults(); }, 100);
    });
    this.querySelector(".filter-toggle").addEventListener("click", (event) => {
      const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
      event.currentTarget.setAttribute("aria-expanded", String(!expanded));
      this.topicList.hidden = expanded;
    });
    this.querySelector(".reset").addEventListener("click", () => {
      this.selectedTopics.clear(); this.search.value = ""; this.searchText = "";
      this.topicList.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", "false"));
      this.updateResults();
    });
    this.querySelector("select").addEventListener("change", (event) => { this.sortBy = event.target.value; this.updateResults(); });
  }

  renderFilters() {
    const topics = new Set();
    this.availableRepositories.forEach((repository) => repository.topics.forEach((topic) => {
      if (topic !== this.productTopic) topics.add(topic);
    }));
    if (!this.productTopic) topics.add("fork");
    [...topics].sort((a, b) => a.localeCompare(b)).forEach((topic) => {
      const button = document.createElement("button");
      button.className = "topic"; button.type = "button"; button.textContent = topic === "fork" ? "forks" : topic;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        if (this.selectedTopics.has(topic)) this.selectedTopics.delete(topic); else this.selectedTopics.add(topic);
        button.setAttribute("aria-pressed", String(this.selectedTopics.has(topic)));
        this.updateResults();
      });
      this.topicList.append(button);
    });
  }

  updateResults() {
    const filtered = this.availableRepositories.filter((repository) => {
      const searchable = `${repository.name} ${repository.description} ${repository.topics.join(" ")} ${repository.language} ${repository.license}`.toLocaleLowerCase();
      return searchable.includes(this.searchText) && [...this.selectedTopics].every((topic) => topic === "fork" ? repository.fork : repository.topics.includes(topic));
    });
    if (this.sortBy) {
      const property = this.sortBy === "topic" ? "topics" : this.sortBy;
      filtered.sort((left, right) => {
        const a = Array.isArray(left[property]) ? left[property].join(", ") : left[property];
        const b = Array.isArray(right[property]) ? right[property].join(", ") : right[property];
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      });
    }
    this.count.textContent = `${filtered.length} ${filtered.length === 1 ? "repository" : "repositories"} found`;
    this.grid.replaceChildren(...(filtered.length ? filtered.map((record) => this.card(record)) : [this.message("No repositories match the current search and filters.")]));
  }

  card(record) {
    const link = document.createElement("a");
    link.className = "repository-card"; link.href = approvedRepositoryUrl(record.url); link.target = "_blank"; link.rel = "noopener noreferrer";
    const name = document.createElement("h2"); name.className = "repository-name"; name.textContent = record.name;
    const description = document.createElement("p"); description.className = "repository-description"; description.textContent = record.description;
    const topics = document.createElement("p"); topics.className = "repository-topics"; topics.textContent = [...record.topics].sort().join(", ");
    const details = document.createElement("div"); details.className = "repository-details";
    const language = document.createElement("span"); language.className = "language";
    const dot = document.createElement("span");
    dot.classList.add("language-dot", LANGUAGE_CLASSES.get(record.language) || "language-unknown");
    const languageName = document.createElement("span"); languageName.textContent = record.language;
    const license = document.createElement("span"); license.textContent = record.license;
    language.append(dot, languageName); details.append(language, license); link.append(name, description, topics, details);
    return link;
  }

  message(text) { const message = document.createElement("p"); message.className = "empty-state"; message.textContent = text; return message; }
}

customElements.define("site-header", SiteHeader);
customElements.define("repository-catalogue", RepositoryCatalogue);
