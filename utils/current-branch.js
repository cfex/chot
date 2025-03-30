import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export const getCurrentBranch = async (repoPath) => {
  try {
    const { stdout } = await execPromise("git rev-parse --abbrev-ref HEAD", {
      cwd: repoPath,
    });
    return stdout.trim();
  } catch {
    return "unknown";
  }
};
