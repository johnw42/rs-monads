import "ts-node/register";
import {
  DEFAULT_PCKE_METHOD,
  DEFAULT_PROMPT,
  DEFAULT_STORAGE_KEY_PREFIX,
  IdentityApi,
  Oauth2Client,
  Oauth2ClientOptions,
  PkceMethod,
  StorageArea,
} from "../src";

const START_TIME = 12345;
const WEB_AUTH_FLOW_URL = "https://example.com/auth";
const CLIENT_ID = "dummy client id";
const SCOPES_ARRAY = ["scope1", "scope2"];
const SCOPES_STRING = "scope1 scope2";
const REDIRECT_URL = "http://example.com/redirect";
const ACCESS_TOKEN = "fake access token";
const AUTH_CODE = "fake auth code";
const ACCESS_TOKEN_LIFETIME = 3600;
const ACCESS_TOKEN_URL = "https://example.com/token";
const EXPIRATION_TIME = START_TIME + 1000 * ACCESS_TOKEN_LIFETIME;
const DEFAULT_STORAGE_KEY = DEFAULT_STORAGE_KEY_PREFIX + CLIENT_ID;
const CUSTOM_STORAGE_KEY = "custom-storage-key";
const MIN_SECONDS_TO_EXPIRATION = 30;
const REFRESH_TOKEN = "fake refresh token";
const NONCE = "fake nonce";
const CLIENT_SECRET = "fake client secret";

// A random 43-character string.
const CODE_VERIFIER =
  "1ZN3rI8LyHDFD5iToHW0fQ24zcktI~EHcn9ndkeSNgMvtjeWEMZAOaVm_tcv";
const CODE_CHALLENGE = "E8aioJOUQj4zrNlWae0RNngd1l_xffNrHj2-eFiFnk8";

const mockStorageArea = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set: jest.fn<Promise<void>, [Record<string, any>]>(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: jest.fn<Promise<Record<string, any>>, [string]>(),
  remove: jest.fn<Promise<void>, [string]>(),
} satisfies StorageArea;

const mockIdentityApi = {
  launchWebAuthFlow: jest.fn<
    Promise<string>,
    [chrome.identity.WebAuthFlowOptions]
  >(),
  getRedirectURL(): string {
    return REDIRECT_URL;
  },
} satisfies IdentityApi;

const COMMON_CLIENT_OPTIONS: Oauth2ClientOptions = {
  url: WEB_AUTH_FLOW_URL,
  clientId: CLIENT_ID,
  scopes: SCOPES_ARRAY,
  storageArea: mockStorageArea,
  identityApi: mockIdentityApi,
  minSecondsToExpiration: MIN_SECONDS_TO_EXPIRATION,
  codeVerifierForTesting: CODE_VERIFIER,
  nonceForTesting: NONCE,
};

interface EffectiveOptions {
  interactive: boolean;
  pkceMethod: PkceMethod | undefined;
}

describe.each([
  [
    "defaults",
    COMMON_CLIENT_OPTIONS,
    { pkceMethod: DEFAULT_PCKE_METHOD, interactive: false },
  ],
  [
    "overrides",
    {
      ...COMMON_CLIENT_OPTIONS,
      scopes: SCOPES_STRING,
      storageKey: CUSTOM_STORAGE_KEY,
      pkceMethod: "plain",
      prompt: "login",
      clientSecretForTesting: CLIENT_SECRET,
    } satisfies Oauth2ClientOptions,
    { pkceMethod: "plain", interactive: true },
  ],
  [
    "no PKCE",
    {
      ...COMMON_CLIENT_OPTIONS,
      pkceMethod: null,
    },
    { pkceMethod: undefined, interactive: false },
  ],
] satisfies [string, Oauth2ClientOptions, EffectiveOptions][])(
  "Oauth2Client with %s",
  (_, clientOptions: Oauth2ClientOptions, { pkceMethod, interactive }) => {
    const {
      prompt = DEFAULT_PROMPT,
      storageKey = DEFAULT_STORAGE_KEY,
      clientSecretForTesting,
    } = clientOptions;

    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.useFakeTimers({ now: START_TIME });
      mockStorageArea.get.mockClear();
      mockStorageArea.set.mockClear();
      mockStorageArea.remove.mockClear();
      mockIdentityApi.launchWebAuthFlow.mockClear();
      fetchSpy = jest.spyOn(global, "fetch").mockImplementation(() => {
        throw Error("not implemented");
      });
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    test("implicit flow", async () => {
      const client = new Oauth2Client(clientOptions);

      mockStorageArea.get.mockResolvedValueOnce({});

      mockIdentityApi.launchWebAuthFlow.mockResolvedValueOnce(
        `http://example.com#access_token=${ACCESS_TOKEN}&expires_in=${ACCESS_TOKEN_LIFETIME}`
      );

      const token = await client.getAccessToken();
      expect(token).toBe(ACCESS_TOKEN);

      const webAuthUrl = new URL(WEB_AUTH_FLOW_URL);
      webAuthUrl.searchParams.set("client_id", CLIENT_ID);
      webAuthUrl.searchParams.set("prompt", prompt);
      webAuthUrl.searchParams.set("redirect_uri", REDIRECT_URL);
      webAuthUrl.searchParams.set("scope", SCOPES_STRING);
      webAuthUrl.searchParams.set("nonce", NONCE);
      webAuthUrl.searchParams.set("response_mode", "fragment");
      webAuthUrl.searchParams.set("response_type", "token");
      expect(mockIdentityApi.launchWebAuthFlow).toHaveBeenCalledWith({
        url: webAuthUrl.toString(),
        interactive,
      });

      const storedValue = JSON.parse(
        mockStorageArea.set.mock.calls[0][0][storageKey]
      );
      expect(storedValue).toEqual({
        webAuthFlowUrl: WEB_AUTH_FLOW_URL,
        clientId: CLIENT_ID,
        scope: SCOPES_STRING,
        expiration: EXPIRATION_TIME,
        accessToken: ACCESS_TOKEN,
        pkceMethod,
      });
    });

    test("implicit flow with expired token", async () => {
      const client = new Oauth2Client(clientOptions);

      mockStorageArea.get.mockResolvedValueOnce({
        [storageKey]: JSON.stringify({
          webAuthFlowUrl: WEB_AUTH_FLOW_URL,
          clientId: CLIENT_ID,
          scope: SCOPES_STRING,
          expiration: 1000 * MIN_SECONDS_TO_EXPIRATION - Date.now() - 1,
          accessToken: ACCESS_TOKEN,
        }),
      });

      mockIdentityApi.launchWebAuthFlow.mockResolvedValueOnce(
        `http://example.com#access_token=${encodeURIComponent(
          ACCESS_TOKEN
        )}&expires_in=${encodeURIComponent(ACCESS_TOKEN_LIFETIME)}`
      );

      const token = await client.getAccessToken();
      expect(token).toBe(ACCESS_TOKEN);

      const storedValue = JSON.parse(
        mockStorageArea.set.mock.calls[0][0][storageKey]
      );
      expect(storedValue).toEqual({
        webAuthFlowUrl: WEB_AUTH_FLOW_URL,
        clientId: CLIENT_ID,
        scope: SCOPES_STRING,
        expiration: EXPIRATION_TIME,
        accessToken: ACCESS_TOKEN,
        pkceMethod,
      });
    });

    test("cached token", async () => {
      const client = new Oauth2Client(clientOptions);

      mockStorageArea.get.mockResolvedValueOnce({
        [storageKey]: JSON.stringify({
          webAuthFlowUrl: WEB_AUTH_FLOW_URL,
          clientId: CLIENT_ID,
          scope: SCOPES_STRING,
          expiration: EXPIRATION_TIME,
          accessToken: ACCESS_TOKEN,
          pkceMethod,
        }),
      });

      const token = await client.getAccessToken();
      expect(token).toBe(ACCESS_TOKEN);

      expect(mockIdentityApi.launchWebAuthFlow).not.toBeCalled();
    });

    test("authorization flow", async () => {
      const client = new Oauth2Client({
        ...clientOptions,
        accessTokenUrl: ACCESS_TOKEN_URL,
      });

      mockStorageArea.get.mockResolvedValueOnce({});

      mockIdentityApi.launchWebAuthFlow.mockResolvedValueOnce(
        `http://example.com#code=${AUTH_CODE}`
      );
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: ACCESS_TOKEN,
            expires_in: ACCESS_TOKEN_LIFETIME,
            refresh_token: REFRESH_TOKEN,
          })
        )
      );

      const token = await client.getAccessToken();
      expect(token).toBe(ACCESS_TOKEN);

      const webAuthUrl = new URL(WEB_AUTH_FLOW_URL);
      webAuthUrl.searchParams.set("client_id", CLIENT_ID);
      webAuthUrl.searchParams.set("prompt", prompt);
      webAuthUrl.searchParams.set("redirect_uri", REDIRECT_URL);
      webAuthUrl.searchParams.set("scope", SCOPES_STRING);
      if (pkceMethod) {
        webAuthUrl.searchParams.set(
          "code_challenge",
          pkceMethod === "S256" ? CODE_CHALLENGE : CODE_VERIFIER
        );
        webAuthUrl.searchParams.set("code_challenge_method", pkceMethod);
      }
      webAuthUrl.searchParams.set("response_mode", "fragment");
      webAuthUrl.searchParams.set("response_type", "code");
      expect(mockIdentityApi.launchWebAuthFlow).toHaveBeenCalledWith({
        url: webAuthUrl.toString(),
        interactive,
      });

      expect(fetchSpy).toHaveBeenCalledWith(ACCESS_TOKEN_URL, {
        method: "post",
        body: expect.any(URLSearchParams),
      });

      const fetchBody: URLSearchParams = fetchSpy.mock.calls[0][1].body;
      expect(Object.fromEntries(fetchBody.entries())).toEqual({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URL,
        scope: SCOPES_STRING,
        grant_type: "authorization_code",
        code: AUTH_CODE,
        code_verifier: pkceMethod ? CODE_VERIFIER : undefined,
        client_secret: clientSecretForTesting,
      });

      const storedValue = JSON.parse(
        mockStorageArea.set.mock.calls[0][0][storageKey]
      );
      expect(storedValue).toEqual({
        webAuthFlowUrl: WEB_AUTH_FLOW_URL,
        clientId: CLIENT_ID,
        scope: SCOPES_STRING,
        expiration: EXPIRATION_TIME,
        accessToken: ACCESS_TOKEN,
        refreshToken: REFRESH_TOKEN,
        accessTokenUrl: ACCESS_TOKEN_URL,
        pkceMethod,
      });
    });

    test("authorization flow with refresh token", async () => {
      const client = new Oauth2Client({
        ...clientOptions,
        accessTokenUrl: ACCESS_TOKEN_URL,
      });

      jest.setSystemTime(EXPIRATION_TIME + 1);

      mockStorageArea.get.mockResolvedValueOnce({
        [storageKey]: JSON.stringify({
          webAuthFlowUrl: WEB_AUTH_FLOW_URL,
          clientId: CLIENT_ID,
          scope: SCOPES_STRING,
          expiration: EXPIRATION_TIME,
          accessTokenUrl: ACCESS_TOKEN_URL,
          accessToken: ACCESS_TOKEN,
          pkceMethod,
          refreshToken: REFRESH_TOKEN,
        }),
      });

      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: ACCESS_TOKEN,
            expires_in: ACCESS_TOKEN_LIFETIME,
            refresh_token: REFRESH_TOKEN,
          })
        )
      );

      const token = await client.getAccessToken();
      expect(token).toBe(ACCESS_TOKEN);

      expect(mockIdentityApi.launchWebAuthFlow).not.toHaveBeenCalled();

      expect(fetchSpy).toHaveBeenCalledWith(ACCESS_TOKEN_URL, {
        method: "post",
        body: expect.any(URLSearchParams),
      });

      const fetchBody: URLSearchParams = fetchSpy.mock.calls[0][1].body;
      expect(Object.fromEntries(fetchBody.entries())).toEqual({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URL,
        scope: SCOPES_STRING,
        grant_type: "refresh_token",
        refresh_token: REFRESH_TOKEN,
        client_secret: clientSecretForTesting,
      });

      const storedValue = JSON.parse(
        mockStorageArea.set.mock.calls[0][0][storageKey]
      );
      expect(storedValue).toEqual({
        webAuthFlowUrl: WEB_AUTH_FLOW_URL,
        clientId: CLIENT_ID,
        scope: SCOPES_STRING,
        expiration: EXPIRATION_TIME + 1 + 1000 * ACCESS_TOKEN_LIFETIME,
        accessToken: ACCESS_TOKEN,
        refreshToken: REFRESH_TOKEN,
        accessTokenUrl: ACCESS_TOKEN_URL,
        pkceMethod,
      });
    });
  }
);
