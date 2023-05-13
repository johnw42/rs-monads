/**
 * An error reported by an OAuth server.
 */
export class Oauth2ServerError extends Error {
  constructor(
    /**
     * The specific error type reported by the OAuth server.  This could be a
     * value defined in the OAuth 2.0 spec or a vendor extension.
     */
    readonly type: string,

    /**
     * The error_description, if any, reported by the server.
     */
    readonly description?: string,

    /**
     * The error_uri, if any, reported by the server.
     */
    readonly uri?: string
  ) {
    super(
      type + (description ? ": " + description : "") + (uri ? ` (${uri})` : "")
    );
  }
}
