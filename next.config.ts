import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";

function getGitValue(...args: string[]) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const commitId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
  || getGitValue("rev-parse", "--short=7", "HEAD")
  || "local";
const baseVersion = 19;
const baseCommitCount = 80;
const commitCount = Number(getGitValue("rev-list", "--count", "HEAD")) || baseCommitCount;
const betaVersion = Math.max(baseVersion, baseVersion + commitCount - baseCommitCount);
const updatedAt = getGitValue("log", "-1", "--format=%cI") || new Date().toISOString();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: `1.0.0-beta.${betaVersion}`,
    NEXT_PUBLIC_APP_UPDATED_AT: updatedAt,
  },
};

export default nextConfig;
