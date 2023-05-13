import { CodeChallengeMethod, IdentityApi, PromptType, StorageArea } from "./types";

export const DEFAULT_CODE_CHALLENGE_METHOD: CodeChallengeMethod = "S256";
export const DEFAULT_CODE_VERIFIER_LENGTH = 43;
export const DEFAULT_MIN_SECONDS_TO_EXPIRATION = 60;
export const DEFAULT_STORAGE_KEY_PREFIX = "oauth2StorageKey-";
export const DEFAULT_PROMPT: PromptType = "none";

/**
 * Options for creating an Oauth2Client
 */
export interface Oauth2ClientOptions {
  /**
   * The URL of the OAuth 2.0 endpoint for the web auth flow, including any
   * vendor-specific query parameters.
   */
  url: string;

  /**
   * The OAuth 2.0 client ID.
   */
  clientId: string;

  /**
   * The scopes to request access for.  Can be an iterable or a single string of
   * space-separated scope names.
   */
  scopes: string | Iterable<string>;

  /**
   * The "prompt" parameter passed to the web auth flow URL.  Defaults to
   * {@link DEFAULT_PROMPT}.
   */
  prompt?: PromptType;

  /**
   * The "login_hint" parameter passed to the web auth flow URL.
   *
   * TODO
   */
  loginHint?: string;

  /**
   * The "domain_hint" parameter passed to the web auth flow URL.
   *
   * TODO
   */
  domainHint?: string;

  /**
   * The code challenge method used for PKCE.  Defaults to
   * {@link DEFAULT_CODE_CHALLENGE_METHOD}.  Only relevant when
   * {@link accessTokenUrl} is set.  Set to null to disable PKCE if necessary.
   */
  codeChallengeMethod?: CodeChallengeMethod | null;

  /**
   * The length of the code verifier string used for PKCE.  Must be between 43
   * and 128.  Defaults to {@link DEFAULT_CODE_VERIFIER_LENGTH}.
   */
  codeVerifierLength?: number;

  /**
   * The grant URL used to request access and refresh tokens for the
   * authorization flow.  If not specified, the implicit flow is used instead.
   * Use of the authorization flow is strongly encouraged.  Typically this URL
   * will point to a server under your control that appends a "client_secret"
   * parameter to the message body and forwards the request to the OAuth server.
   */
  accessTokenUrl?: string;

  /**
   * The client secret to be passed to the
   * {@link Oauth2ClientOptions#accessTokenUrl}.  USE ONLY FOR TESTING. The
   * client secret should never be embedded directly in a browser extension.
   * This parameter is marked deprecated as a reminder to avoid relying on it in
   * production.
   *
   * @deprecated
   */
  clientSecretForTesting?: string;

  /**
   * If a token is close to its expiration time, it is treated as expired.  This
   * parameter controls how many more seconds a token should be valid before it
   * is considered expired.  Defaults to
   * {@link DEFAULT_MIN_SECONDS_TO_EXPIRATION}.
   */
  minSecondsToExpiration?: number;

  /**
   * The key used to store token data in local storage.  Should be unique among
   * all clients.  Defaults to a value derived from the client ID.
   */
  storageKey?: string;

  /**
   * The storage area where tokens are kept. Defaults to
   * {@link chrome.storage.local}.
   */
  storageArea?: StorageArea;

  /**
   * The browser's identity API.  Defaults to {@link chrome.identity}.
   */
  identityApi?: IdentityApi;

  /**
   * An extra string used for validating stored token data.  If the saved value
   * does not match the current value, the saved data will not be used.
   */
  validationString?: string;

  /**
   * If set, specifies a fixed string to use to PCKE verification.  Use only for
   * testing!
   *
   * @deprecated
   */
  codeVerifierForTesting?: string;

  /**
   * If set, specifies a fix string to use as a nonce for the implicit grant
   * flow.  Use only for testing!
   *
   * @deprecated
   */
  nonceForTesting?: string;
}
