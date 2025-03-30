import { checkbox } from "@inquirer/prompts";
import { exec } from "child_process";
import { existsSync, readdirSync, statSync } from "fs";
import ora from "ora";
import { join } from "path";
import { promisify } from "util";
import { getCurrentBranch } from "./current-branch.js";

const execPromise = promisify(exec);

async function getGitRepos(rootDir) {
  if (!existsSync(rootDir) || !statSync(rootDir).isDirectory()) {
    console.error("❌ Invalid path:", rootDir);
    process.exit(1);
  }

  const readDirs = await Promise.all(
    readdirSync(rootDir).map(async (dir) => {
      const repoPath = join(rootDir, dir);
      if (existsSync(join(repoPath, ".git"))) {
        const branch = await getCurrentBranch(repoPath);
        return { name: `${dir} (${branch})`, value: repoPath };
      }
      return null;
    })
  );

  return readDirs.filter(Boolean);
}

async function selectRepos(repos) {
  const selectedRepos = await checkbox({
    message: "Select repositories to update:",
    choices: repos,
    pageSize: 20,
    required: true,
    loop: false,
  });

  return selectedRepos;
}

async function updateRepos(rootDir) {
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
    message: "Enter target branch",
    default: "development",
    required: false,
  });

  const tasks = selectedRepos.map(async (repoPath) => {
    const repoName = repoPath.split("/").pop();
    const spinner = ora(`🔄 Checking out ${repoName}`).start();

    try {
      await execPromise("git fetch", { cwd: repoPath });

      let checkedOut = false;

      try {
        const { stdout } = await execPromise(
          `git checkout ${targetBranch} && git pull`,
          { cwd: repoPath }
        );
        spinner.succeed(`✅ ${repoName} updated to ${branch}\n${stdout}`);
        checkedOut = true;
      } catch {
        spinner.warn(`⚠️ ${repoName}: Branch ${branch} not found.`);
      }

      if (!checkedOut) {
        spinner.fail(`❌ No valid branch found in ${repoName}`);
      }
    } catch (error) {
      spinner.fail(`❌ Error in ${repoName}: ${error.message}`);
    }
  });

  await Promise.all(tasks);
}

export { updateRepos };
