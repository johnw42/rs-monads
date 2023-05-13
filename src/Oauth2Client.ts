import shajs from "sha.js";
import {
  DEFAULT_CODE_CHALLENGE_METHOD,
  DEFAULT_CODE_VERIFIER_LENGTH,
  DEFAULT_STORAGE_KEY_PREFIX,
  Oauth2ClientOptions,
} from "./Oauth2ClientOptions";
import { Oauth2ServerError } from "./Oauth2ServerError";
import { CodeChallengeMethod, IdentityApi, StorageArea } from "./types";
import { randomString } from "./util";
import assert from "tiny-invariant";

function maybeThrowOauth2Error(params: URLSearchParams): void {
  const error = params.get("error");
  const description = params.get("error_description") ?? undefined;
  const uri = params.get("error_uri") ?? undefined;

  if (typeof error === "string") {
    throw new Oauth2ServerError(error, description, uri);
  }
}

interface Oauth2StorageFixed {
  webAuthFlowUrl: string;
  clientId: string;
  scope: string;
  accessToken: string;
  accessTokenUrl: string | undefined;
  codeChallengeMethod: CodeChallengeMethod | undefined;

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
 * An OAuth 2.0 client.
 */
export class Oauth2Client {
  readonly #webAuthFlowUrl: string;
  readonly #clientId: string;
  readonly #prompt: string;
  readonly #scope: string;
  readonly #codeChallengeMethod: CodeChallengeMethod | undefined;
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
    this.#webAuthFlowUrl = opts.url;
    this.#clientId = opts.clientId;
    this.#scope =
      typeof opts.scopes === "string"
        ? opts.scopes
        : Array.from(opts.scopes).join(" ");
    this.#prompt = opts.prompt ?? "none";
    this.#codeChallengeMethod =
      opts.codeChallengeMethod === null
        ? undefined
        : opts.codeChallengeMethod ?? DEFAULT_CODE_CHALLENGE_METHOD;
    this.#codeVerifierLength =
      opts.codeVerifierLength ?? DEFAULT_CODE_VERIFIER_LENGTH;
    this.#accessTokenUrl = opts.accessTokenUrl;
    this.#clientSecretForTesting = opts.clientSecretForTesting;
    this.#minSecondsToExpiration = opts.minSecondsToExpiration ?? 60;
    this.#storageKey =
      opts.storageKey ?? DEFAULT_STORAGE_KEY_PREFIX + this.#clientId;
    this.#storageArea = opts.storageArea ?? chrome.storage.local;
    this.#identityApi = opts.identityApi ?? chrome.identity;
    this.#validationString = opts.validationString;
    this.#codeVerifierForTesting = opts.codeVerifierForTesting;
    this.#nonceForTesting = opts.nonceForTesting;

    if (!opts.accessTokenUrl && "codeChallengeMethod" in opts) {
      console.warn("codeChallengeMethod is ignored without accessTokenUrl");
    }

    if ("codeVerifierLength" in opts && opts.codeChallengeMethod === null) {
      throw Error(
        "cannot specify codeVerifierLength with null codeChallengeMethod"
      );
    }

    if (this.#codeVerifierLength < 43 || this.#codeVerifierLength > 128) {
      throw Error("codeChallengeLength must be between 43 and 128");
    }

    this.#redirectUrl = this.#identityApi.getRedirectURL();
  }

  /**
   * Attempts to get an unexpired access token.  If there is no token, the token
   * is expired, or the token will be expiring very soon (as defined by
   * {@link Oauth2ClientOptions#minSecondsToExpiration}), an attempt is made to
   * fetch a new access token.
   */
  async getAccessToken(): Promise<{ token: string }> {
    const record = await this.#loadRecord();
    let token: string;
    if (record && !this.#recordExpired(record)) {
      token = record.accessToken;
    } else if (this.#accessTokenUrl) {
      token = await this.#fetchAccessTokenByGrant(record?.refreshToken);
    } else {
      token = await this.#fetchAccessTokenByImplicitFlow();
    }
    return { token };
  }

  /**
   * Performs a "fetch" request, attaching an "Authorization" header.
   */
  async fetch(
    request: RequestInfo | URL,
    init: RequestInit = {}
  ): Promise<Response> {
    const { token } = await this.getAccessToken();
    const newRequest = new Request(request, init);
    newRequest.headers.append("Authorization", "Bearer " + token);
    return await fetch(newRequest);
  }

  /**
   * Clears all saved data associated with this client.
   */
  async clearSavedData(): Promise<void> {
    await this.#storageArea.remove(this.#storageKey);
  }

  #recordIsValid(record: Oauth2StorageRecord): boolean {
    return (
      record.webAuthFlowUrl === this.#webAuthFlowUrl &&
      record.clientId === this.#clientId &&
      record.scope === this.#scope &&
      record.accessTokenUrl === this.#accessTokenUrl &&
      (!this.#accessTokenUrl || Boolean(record.refreshToken)) &&
      record.codeChallengeMethod === this.#codeChallengeMethod &&
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
      codeChallengeMethod: this.#codeChallengeMethod,
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
    extraValues: Record<string, string | undefined>
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

    checkIdentityResponse(identityResponse);

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
    if (this.#codeChallengeMethod && this.#codeVerifierLength) {
      codeVerifier =
        this.#codeVerifierForTesting ?? randomString(this.#codeVerifierLength);
    }
    const codeChallenge =
      this.#codeChallengeMethod === "plain"
        ? codeVerifier
        : this.#codeChallengeMethod === "S256"
        ? shajs("sha256")
            .update(codeVerifier)
            .digest("base64")
            .replaceAll("+", "-")
            .replaceAll("/", "_")
            .replace("=", "")
        : undefined;

    const webAuthFlowUrl = new URL(this.#webAuthFlowUrl);
    this.#initSearchParams(webAuthFlowUrl.searchParams, true, {
      code_challenge: codeChallenge,
      code_challenge_method: this.#codeChallengeMethod,
      response_mode: "fragment",
      response_type: "code",
    });
    if (codeChallenge) {
      webAuthFlowUrl.searchParams.set("code_challenge", codeChallenge);
    }
    if (this.#codeChallengeMethod) {
      webAuthFlowUrl.searchParams.set(
        "code_challenge_method",
        this.#codeChallengeMethod
      );
    }
    const identityResponse = await this.#identityApi.launchWebAuthFlow({
      url: webAuthFlowUrl.toString(),
      interactive: this.#prompt !== "none",
    });

    checkIdentityResponse(identityResponse);

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
    assert(this.#accessTokenUrl);

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


    if (resp.status === 400) {
      const data = await resp.json();
      maybeThrowOauth2Error(new URLSearchParams(data));
    }

    if (!resp.ok) {
      throw Error(
        `error getting tokens from code: ${resp.status}: ${await resp.text()}`
      );
    }

    const data = await resp.json();
    const { access_token: accessToken, refresh_token: newRefreshToken, expires_in: expiresIn } = data;

    if (!accessToken) {
      throw Error("missing access_token in response: " + JSON.stringify(data));
    }
    if (!expiresIn) {
      throw Error("missing expires_in in response: " + JSON.stringify(data));
    }
    if (!newRefreshToken && !refreshToken) {
      throw Error("missing refresh_token in response: " + JSON.stringify(data));
    }

    await this.#storeRecord({
      expiration: Date.now() + 1000 * expiresIn,
      accessToken,
      refreshToken: newRefreshToken || refreshToken,
    });

    return accessToken;
  }
}

function checkIdentityResponse(identityResponse: string) {
  if (!identityResponse || typeof identityResponse !== "string") {
    throw Error(global.chrome?.runtime?.lastError?.message || "empty response from identity API");
  }
}

