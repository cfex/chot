#!/usr/bin/env node

import { resolve } from "path";
import { updateRepos } from "./utils/repositories.js";

async function main() {
  const args = process.argv.slice(2);
  const rootDir = args[0] && args[0] !== "." ? resolve(args[0]) : process.cwd();

  await updateRepos(rootDir);
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
