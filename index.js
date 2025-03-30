#!/usr/bin/env node

import { input } from "@inquirer/prompts";
import { resolve } from "path";
import { getGitRepos, selectRepos, updateRepos } from "./utils/repositories.js";

async function main() {
  const args = process.argv.slice(2);
  const rootDir = args[0] && args[0] !== "." ? resolve(args[0]) : process.cwd();

  const repos = await getGitRepos(rootDir);
  if (repos.length === 0) {
    console.log("🚫 No Git repositories found.");
    process.exit(0);
  }

  const selectedRepos = await selectRepos(repos);
  if (selectedRepos.length === 0) {
    console.log("🚫 No repositories selected.");
    process.exit(0);
  }

  const targetBranch = await input({
    message: "Enter target branch (default: development)",
    default: "development",
    required: false,
  });

  await updateRepos(selectedRepos, targetBranch);
  console.log("✅ Done!");
}

main().catch((err) => {
  if (err instanceof Error && err.name === "ExitPromptError") {
    console.log("🚫 Exiting...");
  } else {
    console.error("❌ An error occurred:", err);
  }
  process.exit(1);
});
