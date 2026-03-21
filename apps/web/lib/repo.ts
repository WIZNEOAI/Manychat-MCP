/** Canonical open-source repo for doc links from the web shell. */
export const REPO_TREE_BASE = "https://github.com/gnosix/manychat-mcp/tree/main";
export const REPO_BLOB_BASE = "https://github.com/gnosix/manychat-mcp/blob/main";

export function repoBlobUrl(pathInRepo: string): string {
  const trimmed = pathInRepo.replace(/^\/+/, "");
  return `${REPO_BLOB_BASE}/${trimmed}`;
}
