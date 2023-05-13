// eslint-disable-file @typescript-eslint/no-explicit-any

import { Oauth2Client } from "../src/Oauth2Client";
import {
  DEFAULT_CODE_CHALLENGE_METHOD,
  DEFAULT_PROMPT,
  DEFAULT_STORAGE_KEY_PREFIX,
  Oauth2ClientOptions,
} from "../src/Oauth2ClientOptions";
import { Oauth2ServerError } from "../src/Oauth2ServerError";
import { CodeChallengeMethod, IdentityApi, StorageArea } from "../src/types";

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
const REQUEST_URL = "http://example.com/request";
const ERROR_TYPE = "fake error";
const ERROR_DESCRIPTION = "error description";
const ERROR_URI = "errorUri";
const MOCK_ERROR = "mock error";

// A random 43-character string.
const CODE_VERIFIER =
  "1ZN3rI8LyHDFD5iToHW0fQ24zcktI~EHcn9ndkeSNgMvtjeWEMZAOaVm_tcv";
const CODE_CHALLENGE = "E8aioJOUQj4zrNlWae0RNngd1l_xffNrHj2-eFiFnk8";

const mockStorageArea = {
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockImplementation(() => {
    return {};
  }),
  remove: jest.fn().mockResolvedValue(undefined),
} satisfies StorageArea;

const mockIdentityApi = {
  launchWebAuthFlow: jest.fn(),
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
  interactive?: boolean;
  codeChallengeMethod?: CodeChallengeMethod | undefined;
}

// Install fake chrome functions.
global.chrome = {
  storage: {
    local: mockStorageArea,
  },
  identity: mockIdentityApi,
  runtime: {
    lastError: undefined,
  },
} as unknown as typeof chrome;

describe("Oauth2Client constructor errors", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("accessTokenUrl without codeChallengeMethod", () => {
    const warnSpy = jest.spyOn(console, "warn");
    new Oauth2Client({
      ...COMMON_CLIENT_OPTIONS,
      codeChallengeMethod: "plain",
    });
    expect(warnSpy).toBeCalledWith(
      "codeChallengeMethod is ignored without accessTokenUrl"
    );
  });

  test("codeVerifierLength", () => {
    new Oauth2Client({ ...COMMON_CLIENT_OPTIONS, codeVerifierLength: 43 });
    new Oauth2Client({ ...COMMON_CLIENT_OPTIONS, codeVerifierLength: 128 });
    expect(
      () =>
        new Oauth2Client({ ...COMMON_CLIENT_OPTIONS, codeVerifierLength: 42 })
    ).toThrow(Error);
    expect(
      () =>
        new Oauth2Client({ ...COMMON_CLIENT_OPTIONS, codeVerifierLength: 129 })
    ).toThrow(Error);
  });

  test("no codeVerifierLength with null codeChallengeMethod", () => {
    expect(
      () =>
        new Oauth2Client({
          ...COMMON_CLIENT_OPTIONS,
          codeChallengeMethod: null,
          codeVerifierLength: 43,
        })
    ).toThrow(Error);
  });

  test("dummy for code coverage", () => {
    new Oauth2Client({
      ...COMMON_CLIENT_OPTIONS,
      storageArea: undefined,
      identityApi: undefined,
      minSecondsToExpiration: 1,
    });
  });
});

describe.each([
  ["defaults", {}, {}],
  [
    "overrides",
    {
      scopes: SCOPES_STRING,
      storageKey: CUSTOM_STORAGE_KEY,
      prompt: "login",
    },
    { interactive: true },
  ],
  [
    "accessTokenUrl",
    {
      accessTokenUrl: ACCESS_TOKEN_URL,
    },
    {},
  ],
  [
    "accessTokenUrl and plaintext challenge",
    {
      accessTokenUrl: ACCESS_TOKEN_URL,
      codeChallengeMethod: "plain",
      clientSecretForTesting: CLIENT_SECRET,
    },
    { codeChallengeMethod: "plain" },
  ],
  [
    "accessTokenUrl and no PKCE",
    {
      accessTokenUrl: ACCESS_TOKEN_URL,
      codeChallengeMethod: null,
    },
    { codeChallengeMethod: undefined },
  ],
] satisfies [string, Partial<Oauth2ClientOptions>, EffectiveOptions][])(
  "Oauth2Client with %s",
  (
    _,
    extraClientOptions: Partial<Oauth2ClientOptions>,
    effectiveOptions: EffectiveOptions
  ) => {
    const clientOptions: Oauth2ClientOptions = {
      ...COMMON_CLIENT_OPTIONS,
      ...extraClientOptions,
    };
    const { prompt, storageKey, clientSecretForTesting, accessTokenUrl } = {
      prompt: DEFAULT_PROMPT,
      storageKey: DEFAULT_STORAGE_KEY,
      ...clientOptions,
    };
    const { codeChallengeMethod, interactive } = {
      codeChallengeMethod: DEFAULT_CODE_CHALLENGE_METHOD,
      interactive: false,
      ...effectiveOptions,
    };

    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.useFakeTimers({ now: START_TIME });
      fetchSpy = jest.spyOn(global, "fetch").mockReturnValue(null);
      mockStorageArea.set.mockResolvedValue(undefined),
        mockStorageArea.get.mockImplementation(() => {
          return {};
        }),
        mockStorageArea.remove.mockResolvedValue(undefined),
        mockIdentityApi.launchWebAuthFlow.mockRejectedValue(
          Error("not implemented in test")
        );
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
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
          codeChallengeMethod,
          accessTokenUrl,
          refreshToken: accessTokenUrl ? REFRESH_TOKEN : undefined,
        }),
      });

      const { token } = await client.getAccessToken();
      expect(token).toBe(ACCESS_TOKEN);

      expect(mockIdentityApi.launchWebAuthFlow).not.toBeCalled();
    });

    describe("fetch", () => {
      const DUMMY_HEADER = "dummy value";
      let client: Oauth2Client;

      beforeEach(() => {
        client = new Oauth2Client(clientOptions);
        jest
          .spyOn(client, "getAccessToken")
          .mockResolvedValueOnce({ token: ACCESS_TOKEN });
      });

      test("1 arg", async () => {
        await client.fetch(
          new Request(REQUEST_URL, { headers: { DUMMY_HEADER } })
        );
      });

      test("2 args", async () => {
        await client.fetch(REQUEST_URL, { headers: { DUMMY_HEADER } });
      });

      afterEach(() => {
        const calls = fetchSpy.mock.calls;
        expect(calls.length).toBe(1);

        expect(calls[0][0].url).toBe(REQUEST_URL);
        expect(calls[0][0].headers.get("DUMMY_HEADER")).toBe(DUMMY_HEADER);
        expect(calls[0][0].headers.get("Authorization")).toBe(
          "Bearer " + ACCESS_TOKEN
        );
      });
    });

    test("clearSavedData", async () => {
      const client = new Oauth2Client(clientOptions);
      await client.clearSavedData();

      expect(mockStorageArea.remove).toBeCalledTimes(1);
      expect(mockStorageArea.remove).toBeCalledWith(storageKey);
    });

    test.each`
      lastError
      ${undefined}
      ${{ message: "" }}
      ${{ message: MOCK_ERROR }}
    `("launchWebAuthFlow returns undefined with lastError == $lastError", async ({ lastError }) => {
      const client = new Oauth2Client(clientOptions);

      mockIdentityApi.launchWebAuthFlow.mockImplementationOnce(() => {
        chrome.runtime.lastError = lastError;
        return undefined;
      });

      await expect(() => client.getAccessToken()).rejects.toThrow(
        lastError?.message || Error
      );
    });

    test.each`
      params                                   | condition          | missing
      ${`access_token=${ACCESS_TOKEN}`}        | ${!accessTokenUrl} | ${"expires_in"}
      ${`expires_in=${ACCESS_TOKEN_LIFETIME}`} | ${!accessTokenUrl} | ${"access_token"}
      ${""}                                    | ${accessTokenUrl}  | ${"code"}
    `(
      "launchWebAuthFlow response is missing $missing",
      async ({ params, condition, missing }) => {
        if (condition) {
          const client = new Oauth2Client(clientOptions);
          mockIdentityApi.launchWebAuthFlow.mockResolvedValueOnce(
            "http://example.com#" + params
          );
          await expect(() => client.getAccessToken()).rejects.toThrow(new RegExp(missing));
        }
      }
    );

    if (!accessTokenUrl) {
      test("implicit flow initial grant", async () => {
        const client = new Oauth2Client(clientOptions);

        mockIdentityApi.launchWebAuthFlow.mockResolvedValueOnce(
          `http://example.com#access_token=${ACCESS_TOKEN}&expires_in=${ACCESS_TOKEN_LIFETIME}`
        );

        const { token } = await client.getAccessToken();
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
          codeChallengeMethod,
        });
      });

      test("implicit flow initial grant", async () => {
        const client = new Oauth2Client(clientOptions);

        mockIdentityApi.launchWebAuthFlow.mockResolvedValueOnce(
          `http://example.com#access_token=${ACCESS_TOKEN}&expires_in=${ACCESS_TOKEN_LIFETIME}`
        );

        const { token } = await client.getAccessToken();
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
          codeChallengeMethod,
        });
      });

      test("launchWebAuthFlow fails to return access token", async () => {
        const client = new Oauth2Client(clientOptions);

        mockIdentityApi.launchWebAuthFlow.mockResolvedValueOnce(
          `http://example.com#access_token=${ACCESS_TOKEN}&expires_in=${ACCESS_TOKEN_LIFETIME}`
        );

        const { token } = await client.getAccessToken();
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
          codeChallengeMethod,
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

        const { token } = await client.getAccessToken();
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
          codeChallengeMethod,
        });
      });
    }

    if (accessTokenUrl) {
      test("auth flow initial grant", async () => {
        const client = new Oauth2Client(clientOptions);

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

        const { token } = await client.getAccessToken();
        expect(token).toBe(ACCESS_TOKEN);

        const webAuthUrl = new URL(WEB_AUTH_FLOW_URL);
        webAuthUrl.searchParams.set("client_id", CLIENT_ID);
        webAuthUrl.searchParams.set("prompt", prompt);
        webAuthUrl.searchParams.set("redirect_uri", REDIRECT_URL);
        webAuthUrl.searchParams.set("scope", SCOPES_STRING);
        if (codeChallengeMethod) {
          webAuthUrl.searchParams.set(
            "code_challenge",
            codeChallengeMethod === "S256" ? CODE_CHALLENGE : CODE_VERIFIER
          );
          webAuthUrl.searchParams.set(
            "code_challenge_method",
            codeChallengeMethod
          );
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
          code_verifier: codeChallengeMethod ? CODE_VERIFIER : undefined,
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
          codeChallengeMethod,
        });
      });

      test("refresh grant", async () => {
        const client = new Oauth2Client(clientOptions);

        jest.setSystemTime(EXPIRATION_TIME + 1);

        mockStorageArea.get.mockResolvedValueOnce({
          [storageKey]: JSON.stringify({
            webAuthFlowUrl: WEB_AUTH_FLOW_URL,
            clientId: CLIENT_ID,
            scope: SCOPES_STRING,
            expiration: EXPIRATION_TIME,
            accessTokenUrl: ACCESS_TOKEN_URL,
            accessToken: ACCESS_TOKEN,
            codeChallengeMethod,
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

        const { token } = await client.getAccessToken();
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
          codeChallengeMethod,
        });
      });

      test("error response from fetch", async () => {
        const client = new Oauth2Client(clientOptions);

        mockIdentityApi.launchWebAuthFlow.mockResolvedValueOnce(
          `http://example.com#code=${AUTH_CODE}`
        );
        fetchSpy.mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              error: ERROR_TYPE,
              error_description: ERROR_DESCRIPTION,
              error_uri: ERROR_URI,
            }),
            { status: 400 }
          )
        );

        try {
          await client.getAccessToken();
          expect(true).toBe(false);
        } catch (error) {
          if (error instanceof Oauth2ServerError) {
            expect(error.type).toBe(ERROR_TYPE);
            expect(error.description).toBe(ERROR_DESCRIPTION);
            expect(error.uri).toBe(ERROR_URI);
          } else {
            throw error;
          }
        }
      });


      test.each`
        status 
        ${404}
        ${500}
      `("fetch returns HTTP error $status", async ({ status }) => {
        const client = new Oauth2Client(clientOptions);
        mockIdentityApi.launchWebAuthFlow.mockResolvedValueOnce(
          `http://example.com#code=${AUTH_CODE}`
        );
        fetchSpy.mockResolvedValueOnce(
          new Response("", {status})
        );
        await expect(() => client.getAccessToken()).rejects.toThrow(new RegExp(String(status)));
      });

      test.each`
        missingField       | error
        ${"access_token"}  | ${/access_token/}
        ${"expires_in"}    | ${/expires_in/}
        ${"refresh_token"} | ${/refresh_token/}
      `("fetch result is missing $missingField", async ({ missingField, error }) => {
        const client = new Oauth2Client(clientOptions);
        mockIdentityApi.launchWebAuthFlow.mockResolvedValueOnce(
          `http://example.com#code=${AUTH_CODE}`
        );
        const responseFields = {
          access_token: ACCESS_TOKEN,
          expires_in: ACCESS_TOKEN_LIFETIME,
          refresh_token: REFRESH_TOKEN,
        };
        delete responseFields[missingField];
        fetchSpy.mockResolvedValueOnce(
          new Response(JSON.stringify(responseFields))
        );
        await expect(() => client.getAccessToken()).rejects.toThrow(error);
      });
    }

    test("error response from launchWebAuthFlow", async () => {
      const client = new Oauth2Client(clientOptions);

      mockIdentityApi.launchWebAuthFlow.mockResolvedValueOnce(
        "http://example.com#" +
          new URLSearchParams({
            error: ERROR_TYPE,
            error_description: ERROR_DESCRIPTION,
            error_uri: ERROR_URI,
          }).toString()
      );

      try {
        await client.getAccessToken();
        expect(true).toBe(false);
      } catch (error) {
        if (error instanceof Oauth2ServerError) {
          expect(error.type).toBe(ERROR_TYPE);
          expect(error.description).toBe(ERROR_DESCRIPTION);
          expect(error.uri).toBe(ERROR_URI);
        } else {
          throw error;
        }
      }
    });
  }
);
