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

  const repos = [];

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

async function updateRepos(repos, targetBranch) {
  const tasks = repos.map(async (repoPath) => {
    const repoName = repoPath.split("/").pop();
    const spinner = ora(`🔄 Checking out ${repoName}`).start();

    try {
      await execPromise("git fetch", { cwd: repoPath });

      const branches = [targetBranch, "main", "master"];
      let checkedOut = false;

      for (const branch of branches) {
        try {
          const { stdout } = await execPromise(
            `git checkout ${branch} && git pull`,
            { cwd: repoPath }
          );
          spinner.succeed(`✅ ${repoName} updated to ${branch}\n${stdout}`);
          checkedOut = true;
          break;
        } catch {
          spinner.warn(`⚠️ ${repoName}: Branch ${branch} not found.`);
        }
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

export { getGitRepos, selectRepos, updateRepos };
