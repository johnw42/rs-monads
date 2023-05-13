export type CodeChallengeMethod = "S256" | "plain";
export type PromptType = "none" | "login" | "select_account" | "consent";

/**
 * A subset of the methods of {@link chrome.storage.StorageArea}.
 */
export interface StorageArea {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(items: { [key: string]: any }): Promise<void>;
  remove(key: string): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(key: string): Promise<{ [key: string]: any }>;
}

/**
 * A subset of the functions of {@link chrome.identity}.
 */
export interface IdentityApi {
  launchWebAuthFlow(
    details: chrome.identity.WebAuthFlowOptions
  ): Promise<string | undefined>;
  getRedirectURL(): string;
}