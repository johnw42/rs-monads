# chrome-extension-oauth2

This package aims to be, as much as possible, a "batteries-included" solution to
[OAuth 2.0](https://oauth.net/2/) authentication in extensions for
Chromium-compatible browsers such as Chrome and Edge.

## Status

This project is in prerelease.  Minor versions may introduce breaking changes to
the API.

## Prerequisities

* The usual prerequisites for OAuth 2.0, such as a registered application with a
  client ID, etc. to identify it to the authentication endpoints.  Some
  familiarity with OAuth 2.0 framework will be needed to make use of this
  library.
* A browser that supports the `chrome.identity` and `chrome.storage` APIs, or
  comparable APIs that can be adapted support the same function signatures.
* Your extension must include the "identity" and "storage" permissions in its
  manifest.
* In order to support persistent authorization, you will need to run your own
  server that accepts 

## Features

* Constructing and making HTTPS requests to OAuth 2.0 endpoints.
* Saving credentials in persistent storage.
* Refreshing expired credentials.
* Reporting errors from OAuth 2.0 endpoints as specified by [RFC
  6749](https://datatracker.ietf.org/doc/html/rfc6749).
* PKCE using the `S256` and `plain` methods.
* Full Typescript support.

## Example Usage

This example shows how to request a user's basic informtion using the Microsoft
Graph API with the implicit grant flow.

```typescript
import { Oauth2Client } from "chrome-extension-oauth2";

// The client should normally be kept at the global scope.
const client = new Oauth2Client({
    url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    clientId: "<your-client-id>",
    scopes: ["openid", "https://graph.microsoft.com/User.Read"],
    prompt: "select_account",
});

// Fetch the information, requesting authorization from the user only if necessary.
async function demo() {
    const response = await client.fetch("https://graph.microsoft.com/v1.0/me");
    console.log(await response.json());
}
```

## Known Limitations

* Only "authorization code" and "implicit" grant flows are supported.
* Authorization types other than "Bearer" are not supported.
* There is no way to set or retrieve the `state` field of requests or responses.

## Related Work

An older package,
[browser-extension-oauth2](https://www.npmjs.com/package/browser-extension-oauth2)
supports a smaller feature set an may be more appropriate for some users.

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
