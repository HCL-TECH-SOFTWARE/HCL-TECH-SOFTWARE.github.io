import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const API_URL = "https://api.github.com/graphql";
const ORG = process.env.ORG || "HCL-TECH-SOFTWARE";
const OUTPUT = new URL("../data/repositories.json", import.meta.url);

const LANGUAGE_COLOURS = {
  "C++": "#f34b7d", JavaScript: "#f1e05a", TypeScript: "#2b7489",
  HTML: "#e34c26", CSS: "#563d7c", Python: "#3572A5", Xtend: "#ccc",
  Java: "#b07219", C: "#555555", "C#": "#178600", "Jupyter Notebook": "#DA5B0B",
  Go: "#00ADD8", Shell: "#89e051", PHP: "#4F5D95", Ruby: "#701516",
  Perl: "#0298c3", Swift: "#ffac45", "Objective-C": "#438eff", Groovy: "#e69f56",
  Scala: "#c22d40", WebAssembly: "#04133b", Rust: "#dea584", Jinja: "#a52a22"
};

const QUERY = `query Repositories($organization: String!, $cursor: String) {
  organization(login: $organization) {
    repositories(first: 100, after: $cursor) {
      nodes {
        name
        description
        url
        isPrivate
        isFork
        licenseInfo { name }
        primaryLanguage { name }
        repositoryTopics(first: 100) { nodes { topic { name } } }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

function approvedUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com" &&
      url.pathname.startsWith(`/${ORG}/`) && url.pathname.split("/").filter(Boolean).length === 2;
  } catch {
    return false;
  }
}

export function normaliseRepository(repository) {
  if (repository.isPrivate || !approvedUrl(repository.url) || !repository.name) return null;
  const topics = repository.repositoryTopics.nodes.map(({ topic }) => topic.name).filter(Boolean);
  return {
    name: repository.name,
    description: repository.description || "",
    url: repository.url,
    private: false,
    fork: repository.isFork,
    license: repository.licenseInfo?.name || "",
    language: repository.primaryLanguage?.name || "Not Identified",
    languageColor: LANGUAGE_COLOURS[repository.primaryLanguage?.name] || "#fff",
    topics
  };
}

async function queryRepositories(token, cursor) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { organization: ORG, cursor } })
  });
  if (!response.ok) throw new Error(`GitHub GraphQL request failed with ${response.status}.`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(`GitHub GraphQL returned errors: ${JSON.stringify(payload.errors)}`);
  if (!payload.data?.organization) throw new Error(`GitHub organization "${ORG}" was not found.`);
  return payload.data.organization.repositories;
}

export async function retrieveRepositories(token) {
  const records = [];
  let cursor = null;
  do {
    const page = await queryRepositories(token, cursor);
    for (const repository of page.nodes) {
      const normalised = normaliseRepository(repository);
      if (normalised) records.push(normalised);
    }
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);
  return records;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required.");
  const repositories = await retrieveRepositories(token);
  if (repositories.length === 0) throw new Error("GitHub returned no public repositories. Refusing to replace catalogue data.");
  await writeFile(OUTPUT, `${JSON.stringify(repositories, null, 2)}\n`);
  console.log(`Wrote ${repositories.length} public repositories to ${OUTPUT.pathname}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
