import shajs from "sha.js";

export type PkceMethod = "S256" | "plain";
export type PromptType = "none" | "login" | "select_account" | "consent";

export const DEFAULT_PCKE_METHOD: PkceMethod = "S256";
export const DEFAULT_CODE_VERIFIER_LENGTH = 43;
export const DEFAULT_MIN_SECONDS_TO_EXPIRATION = 60;
export const DEFAULT_STORAGE_KEY_PREFIX = "oauth2StorageKey-";
export const DEFAULT_PROMPT: PromptType = "none";

/**
 * A subset of the methods on {@code chrome.storage.StorageArea}.
 */
export interface StorageArea {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(items: { [key: string]: any }): Promise<void>;
  remove(key: string): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(key: string): Promise<{ [key: string]: any }>;
}

/**
 * A subset of the functions of {@code chrome.identity}.
 */
export interface IdentityApi {
  launchWebAuthFlow(
    details: chrome.identity.WebAuthFlowOptions
  ): Promise<string | undefined>;
  getRedirectURL(): string;
}

/**
 * An error reported by an OAuth server.
 */
export class Oauth2ServerError extends Error {
  constructor(
    /**
     * The specific error type reported by the OAuth server.  This could be a
     * value defined in the OAuth 2.0 spec or a vendor extension.
     */
    readonly errorType: string,
    message: string
  ) {
    super(message);
  }
}

function maybeThrowOauth2Error(params: unknown): void {
  let error: unknown;
  let description: unknown;

  if (params instanceof URLSearchParams) {
    error = params.get("error");
    description = params.get("error_description");
  } else if (
    typeof params === "object" &&
    params &&
    "error" in params &&
    "description" in params
  ) {
    error = params.error as string;
    description = params.description;
  }

  if (typeof error === "string") {
    throw new Oauth2ServerError(
      error,
      `${error}: ${description || "no description"}`
    );
  }
}

interface Oauth2StorageFixed {
  webAuthFlowUrl: string;
  clientId: string;
  scope: string;
  accessToken: string;
  accessTokenUrl: string | undefined;
  pkceMethod: PkceMethod | undefined;

  /**
   * Arbitrary data used to verify that data loaded from storage is valid.
   */
  validationString: string | undefined;
}

interface Oauth2StorageVariable {
  expiration: number;
  accessToken: string;
  refreshToken: string | undefined;
}

type Oauth2StorageRecord = Oauth2StorageFixed & Oauth2StorageVariable;

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
   * The "prompt" parameter passed to the web auth flow URL.  Defaults to "none".
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
   * {@code DEFAULT_CODE_CHALLENGE_METHOD} (S256).  Set to null to disable PKCE
   * if necessary.
   */
  pkceMethod?: PkceMethod | null;

  /**
   * The length of the code verifier string used for PKCE.  Must be between 43
   * and 128.  Defaults to {@code DEFAULT_CODE_VERIFIER_LENGTH} (43).
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
   * The client secret to be passed to the {@code #accessTokenUrl}.  USE ONLY
   * FOR TESTING. The client secret should never be embedded directly in a
   * browser extension.  This parameter is marked deprecated as a reminder to
   * avoid relying on it.
   *
   * @deprecated
   */
  clientSecretForTesting?: string;

  /**
   * If a token is close to its expiration time, it is treated as expired.  This
   * parameter controls how many more seconds a token should be valid before it
   * is considered expired.  Defaults to
   * {@code DEFAULT_MIN_SECONDS_TO_EXPIRATION} (60).
   */
  minSecondsToExpiration?: number;

  /**
   * The key used to store token data in local storage.  Should be unique among
   * all clients.  Defaults to a value derived from the client ID.
   */
  storageKey?: string;

  /**
   * The storage area where tokens are kept. Defaults to
   * {@code chrome.storage.local}.
   */
  storageArea?: StorageArea;

  /**
   * The browser's identity API.  Defaults to {@code chrome.identity}.
   */
  identityApi?: IdentityApi;

  /**
   * An extra string used for validating stored token data.  If the saved value
   * does not match the current value, the saved data will not be used.
   */
  validationString?: string;

  // for testing
  codeVerifierForTesting?: string;
  nonceForTesting?: string;
}

/**
 * An OAuth 2.0 client.
 */
export class Oauth2Client {
  readonly #webAuthFlowUrl: string;
  readonly #clientId: string;
  readonly #prompt: string;
  readonly #scope: string;
  readonly #pkceMethod: PkceMethod | undefined;
  readonly #codeVerifierLength: number | undefined;
  readonly #accessTokenUrl: string | undefined;
  readonly #clientSecretForTesting: string | undefined;
  readonly #minSecondsToExpiration: number;
  readonly #storageKey: string;
  readonly #storageArea: StorageArea;
  readonly #validationString: string | undefined;
  readonly #identityApi: IdentityApi;
  readonly #redirectUrl: string;
  readonly #codeVerifierForTesting: string | undefined;
  readonly #nonceForTesting: string | undefined;

  constructor(opts: Oauth2ClientOptions) {
    if (opts.pkceMethod && !opts.accessTokenUrl) {
      throw Error("cannot specify pkceMethod without accessTokenUrl");
    }
    if ("codeVerifierLength" in opts && opts.pkceMethod === null) {
      throw Error(
        "cannot specify codeVerifierLength with null pkceMethod"
      );
    }

    this.#webAuthFlowUrl = opts.url;
    this.#clientId = opts.clientId;
    this.#scope =
      typeof opts.scopes === "string"
        ? opts.scopes
        : Array.from(opts.scopes).join(" ");
    this.#prompt = opts.prompt ?? "none";
    this.#pkceMethod =
      opts.pkceMethod === null
        ? undefined
        : opts.pkceMethod ??
        (opts.accessTokenUrl ? DEFAULT_PCKE_METHOD : undefined);
    this.#codeVerifierLength = opts.codeVerifierLength ?? DEFAULT_CODE_VERIFIER_LENGTH;
    this.#accessTokenUrl = opts.accessTokenUrl;
    this.#clientSecretForTesting = opts.clientSecretForTesting;
    this.#minSecondsToExpiration = opts.minSecondsToExpiration ?? 60;
    this.#storageKey = opts.storageKey ?? DEFAULT_STORAGE_KEY_PREFIX + this.#clientId;
    this.#storageArea = opts.storageArea ?? chrome.storage.local;
    this.#identityApi = opts.identityApi ?? chrome.identity;
    this.#validationString = opts.validationString;
    this.#codeVerifierForTesting = opts.codeVerifierForTesting;
    this.#nonceForTesting = opts.nonceForTesting;

    if (this.#codeVerifierLength < 43 || this.#codeVerifierLength > 128) {
      throw Error("codeChallengeLength must be between 43 and 128");
    }

    this.#redirectUrl = this.#identityApi.getRedirectURL();
  }

  /**
   * Attempts to get an unexpired access token.  If there is no token, the token
   * is expired, or the token will be expiring very soon (as defined by
   * {@code Oauth2ClientOptions#minSecondsToExpiration}), an attempt is made to
   * fetch a new access token.
   */
  async getAccessToken(): Promise<string> {
    const record = await this.#loadRecord();
    if (record && !this.#recordExpired(record)) {
      return record.accessToken;
    } else if (this.#accessTokenUrl) {
      return await this.#fetchAccessTokenByGrant(record?.refreshToken);
    } else {
      return await this.#fetchAccessTokenByImplicitFlow();
    }
  }

  /**
   * Performs a "fetch" request, attaching an "Authorization" header.
   */
  async fetch(
    request: RequestInfo | URL,
    init: RequestInit = {}
  ): Promise<Response> {
    const token = this.getAccessToken();
    const headers = new Headers(init.headers);
    headers.append("Authorization", "Bearer " + token);
    init.headers = headers;
    return await fetch(request, init);
  }

  /**
   * Clears all saved data associated with this client.
   */
  async clearSavedData(): Promise<void> {
    this.#storageArea.remove(this.#storageKey);
  }

  #recordIsValid(record: Oauth2StorageRecord): boolean {
    return (
      record.webAuthFlowUrl === this.#webAuthFlowUrl &&
      record.clientId === this.#clientId &&
      record.scope === this.#scope &&
      record.accessTokenUrl === this.#accessTokenUrl &&
      (!this.#accessTokenUrl || Boolean(record.refreshToken)) &&
      record.pkceMethod === this.#pkceMethod &&
      record.validationString === this.#validationString
    );
  }

  #recordExpired(record: Oauth2StorageRecord): boolean {
    return record.expiration < Date.now() + 1000 * this.#minSecondsToExpiration;
  }

  async #storeRecord(record: Oauth2StorageVariable): Promise<void> {
    const fullRecord: Oauth2StorageRecord = {
      webAuthFlowUrl: this.#webAuthFlowUrl,
      clientId: this.#clientId,
      scope: this.#scope,
      accessTokenUrl: this.#accessTokenUrl,
      pkceMethod: this.#pkceMethod,
      validationString: this.#validationString,
      ...record,
    };

    const toSet = { [this.#storageKey]: JSON.stringify(fullRecord) };
    await this.#storageArea.set(toSet);
  }

  async #loadRecord(): Promise<Oauth2StorageRecord | null> {
    const storageData = await this.#storageArea.get(this.#storageKey);
    const recordStr = storageData[this.#storageKey];
    const record = recordStr && (JSON.parse(recordStr) as Oauth2StorageRecord);

    if (record && this.#recordIsValid(record)) {
      return record;
    }

    return null;
  }

  #initSearchParams(
    params: URLSearchParams,
    includePrompt: boolean,
    extraValues: Record<string, string | undefined> = {}
  ): void {
    params.set("client_id", this.#clientId);
    if (includePrompt) {
      params.set("prompt", this.#prompt);
    }
    params.set("redirect_uri", this.#redirectUrl);
    params.set("scope", this.#scope);
    for (const key of Object.getOwnPropertyNames(extraValues)) {
      const value = extraValues[key];
      if (value !== undefined) {
        params.set(key, value);
      }
    }
  }

  async #fetchAccessTokenByImplicitFlow(): Promise<string> {
    const webAuthFlowUrl = new URL(this.#webAuthFlowUrl);
    this.#initSearchParams(webAuthFlowUrl.searchParams, true, {
      nonce: this.#nonceForTesting ?? randomString(64),
      response_mode: "fragment",
      response_type: "token",
    });

    const identityResponse = await this.#identityApi.launchWebAuthFlow({
      url: webAuthFlowUrl.toString(),
      interactive: this.#prompt !== "none",
    });

    if (!identityResponse) {
      throw Error("empty response from identity API");
    }

    const identityParams = new URL(identityResponse.replace("#", "?"))
      .searchParams;
    maybeThrowOauth2Error(identityParams);

    const accessToken = identityParams.get("access_token");
    if (!accessToken) {
      throw Error("no access_token in identity response: " + identityResponse);
    }
    const expiresIn = identityParams.get("expires_in");
    if (!expiresIn) {
      throw Error(
        "no expires_in field in indentity response: " + identityResponse
      );
    }

    await this.#storeRecord({
      expiration: Date.now() + 1000 * parseInt(expiresIn),
      accessToken,
      refreshToken: undefined,
    });

    return accessToken;
  }

  async #fetchCode(): Promise<{ code: string; codeVerifier: string }> {
    let codeVerifier: string | undefined;
    if (this.#pkceMethod && this.#codeVerifierLength) {
      codeVerifier = this.#codeVerifierForTesting ?? randomString(this.#codeVerifierLength);
    }
    const codeChallenge =
      this.#pkceMethod === "plain"
        ? codeVerifier
        : this.#pkceMethod === "S256"
        ? shajs("sha256")
            .update(codeVerifier)
            .digest("base64")
            .replaceAll("+", "-")
            .replaceAll("/", "_")
            .replace("=", "")
          : undefined;

    console.log(codeVerifier, codeChallenge);

    const webAuthFlowUrl = new URL(this.#webAuthFlowUrl);
    this.#initSearchParams(webAuthFlowUrl.searchParams, true, {
      code_challenge: codeChallenge,
      code_challenge_method: this.#pkceMethod,
      response_mode: "fragment",
      response_type: "code",
    });
    if (codeChallenge) {
      webAuthFlowUrl.searchParams.set("code_challenge", codeChallenge);
    }
    if (this.#pkceMethod) {
      webAuthFlowUrl.searchParams.set(
        "code_challenge_method",
        this.#pkceMethod
      );
    }
    const identityResponse = await this.#identityApi.launchWebAuthFlow({
      url: webAuthFlowUrl.toString(),
      interactive: this.#prompt !== "none",
    });

    if (!identityResponse) {
      throw Error("empty response from identity API");
    }

    const identityParams = new URL(identityResponse.replace("#", "?"))
      .searchParams;
    maybeThrowOauth2Error(identityParams);

    const code = identityParams.get("code");
    if (!code) {
      throw Error("no code in response: " + identityResponse);
    }

    return { code, codeVerifier };
  }

  async #fetchAccessTokenByGrant(
    refreshToken: string | undefined
  ): Promise<string> {
    if (!this.#accessTokenUrl) {
      throw Error("missing or invalid accessTokenUrl");
    }

    const body = new URLSearchParams();
    let extraParams: Record<string, string>;
    if (refreshToken) {
      extraParams = {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      };
    } else {
      const { code, codeVerifier } = await this.#fetchCode();
      extraParams = {
        grant_type: "authorization_code",
        code,
        code_verifier: codeVerifier,
      };
    }
    extraParams.client_secret = this.#clientSecretForTesting;
    this.#initSearchParams(body, false, extraParams);

    const fetchUrl = new URL(this.#accessTokenUrl);
    const resp = await fetch(fetchUrl.toString(), {
      method: "post",
      body,
    });

    if (!resp.ok) {
      throw Error(
        `error getting tokens from code: ${resp.status}: ${await resp.text()}`
      );
    }

    const data = await resp.json();
    maybeThrowOauth2Error(data);

    const { access_token: accessToken, refresh_token: newRefreshToken } = data;

    if (!accessToken) {
      throw Error("missing access_token in response: " + JSON.stringify(data));
    }
    if (!newRefreshToken && !refreshToken) {
      throw Error("missing refresh_token in response: " + JSON.stringify(data));
    }

    await this.#storeRecord({
      expiration: Date.now() + 1000 * data.expires_in,
      accessToken,
      refreshToken: newRefreshToken || refreshToken,
    });

    return accessToken;
  }
}

/**
 * Gets a random string of the given length suitable for use as a code verifier.
 */
function randomString(length: number) {
  let s = "";
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_~";
  while (s.length < length) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}
