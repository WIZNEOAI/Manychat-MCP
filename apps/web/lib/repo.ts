/**
 * Canonical repo for doc links (matches root package.json `repository.url` main branch).
 * Override at build time with NEXT_PUBLIC_GITHUB_REPO_BASE if the deployed fork differs.
 */
const repoRoot =
  process.env.NEXT_PUBLIC_GITHUB_REPO_BASE ?? "https://github.com/gnosix/manychat-mcp";

export const REPO_TREE_BASE = `${repoRoot}/tree/main`;
export const REPO_BLOB_BASE = `${repoRoot}/blob/main`;

export function repoBlobUrl(pathInRepo: string): string {
  const trimmed = pathInRepo.replace(/^\/+/, "");
  return `${REPO_BLOB_BASE}/${trimmed}`;
}
