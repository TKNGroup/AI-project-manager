/**
 * Enumeration of all standard HTTP status codes.
 */
export enum HttpStatus {
  // 1xx – Informational
  /** 100 Continue – The client should continue with the request */
  CONTINUE = 100,
  /** 101 Switching Protocols – The server is switching protocols as requested */
  SWITCHING_PROTOCOLS = 101,
  /** 102 Processing – WebDAV: the server is processing the request */
  PROCESSING = 102,
  /** 103 Early Hints – Early hints, typically for Link headers */
  EARLY_HINTS = 103,

  // 2xx – Success
  /** 200 OK – The request has succeeded */
  OK = 200,
  /** 201 Created – The request has succeeded and a new resource has been created */
  CREATED = 201,
  /** 202 Accepted – The request has been accepted for processing, but processing is not complete */
  ACCEPTED = 202,
  /** 203 Non-Authoritative Information – The returned meta-information is not from the origin server */
  NON_AUTHORITATIVE_INFORMATION = 203,
  /** 204 No Content – The server successfully processed the request, but is not returning any content */
  NO_CONTENT = 204,
  /** 205 Reset Content – The server successfully processed the request, but asks the client to reset the document view */
  RESET_CONTENT = 205,
  /** 206 Partial Content – The server is delivering only part of the resource due to a range header sent by the client */
  PARTIAL_CONTENT = 206,
  /** 207 Multi-Status – WebDAV: conveys information about multiple resources */
  MULTI_STATUS = 207,
  /** 208 Already Reported – WebDAV: members of a DAV binding have already been enumerated in a previous reply */
  ALREADY_REPORTED = 208,
  /** 226 IM Used – The server has fulfilled a GET request for the resource, and the response is a representation of the result of one or more instance-manipulations */
  IM_USED = 226,

  // 3xx – Redirection
  /** 300 Multiple Choices – Multiple options for the resource that the client may follow */
  MULTIPLE_CHOICES = 300,
  /** 301 Moved Permanently – The resource has been permanently moved to a new URI */
  MOVED_PERMANENTLY = 301,
  /** 302 Found – The resource resides temporarily under a different URI */
  FOUND = 302,
  /** 303 See Other – The response to the request can be found under another URI */
  SEE_OTHER = 303,
  /** 304 Not Modified – The resource has not been modified since the version specified by the request headers */
  NOT_MODIFIED = 304,
  /** 305 Use Proxy – The requested resource must be accessed through the proxy given by the Location field */
  USE_PROXY = 305,
  /** 306 Switch Proxy – No longer used */
  SWITCH_PROXY = 306,
  /** 307 Temporary Redirect – The request should be repeated with another URI; future requests should still use the original URI */
  TEMPORARY_REDIRECT = 307,
  /** 308 Permanent Redirect – The request and all future requests should be repeated using another URI */
  PERMANENT_REDIRECT = 308,

  // 4xx – Client Errors
  /** 400 Bad Request – The server cannot or will not process the request due to an apparent client error */
  BAD_REQUEST = 400,
  /** 401 Unauthorized – Authentication is required and has failed or has not yet been provided */
  UNAUTHORIZED = 401,
  /** 402 Payment Required – Reserved for future use */
  PAYMENT_REQUIRED = 402,
  /** 403 Forbidden – The request was valid, but the server is refusing action */
  FORBIDDEN = 403,
  /** 404 Not Found – The requested resource could not be found */
  NOT_FOUND = 404,
  /** 405 Method Not Allowed – A request method is not supported for the requested resource */
  METHOD_NOT_ALLOWED = 405,
  /** 406 Not Acceptable – The requested resource is capable of generating only content not acceptable according to the Accept headers */
  NOT_ACCEPTABLE = 406,
  /** 407 Proxy Authentication Required – The client must first authenticate itself with the proxy */
  PROXY_AUTHENTICATION_REQUIRED = 407,
  /** 408 Request Timeout – The server timed out waiting for the request */
  REQUEST_TIMEOUT = 408,
  /** 409 Conflict – The request could not be completed due to a conflict with the current state of the target resource */
  CONFLICT = 409,
  /** 410 Gone – The resource requested is no longer available and will not be available again */
  GONE = 410,
  /** 411 Length Required – The request did not specify the length of its content */
  LENGTH_REQUIRED = 411,
  /** 412 Precondition Failed – The server does not meet one of the preconditions specified by the client */
  PRECONDITION_FAILED = 412,
  /** 413 Payload Too Large – The request is larger than the server is willing or able to process */
  PAYLOAD_TOO_LARGE = 413,
  /** 414 URI Too Long – The URI provided was too long for the server to process */
  URI_TOO_LONG = 414,
  /** 415 Unsupported Media Type – The request entity has a media type which the server or resource does not support */
  UNSUPPORTED_MEDIA_TYPE = 415,
  /** 416 Range Not Satisfiable – The client has asked for a portion of the file, but the server cannot supply that portion */
  RANGE_NOT_SATISFIABLE = 416,
  /** 417 Expectation Failed – The server cannot meet the requirements of the Expect request-header field */
  EXPECTATION_FAILED = 417,
  /** 418 I'm a teapot – Defined in RFC 2324 as an April Fools’ joke */
  IM_A_TEAPOT = 418,
  /** 421 Misdirected Request – The request was directed at a server that is not able to produce a response */
  MISDIRECTED_REQUEST = 421,
  /** 422 Unprocessable Entity – The request was well-formed but was unable to be followed due to semantic errors */
  UNPROCESSABLE_ENTITY = 422,
  /** 423 Locked – The resource that is being accessed is locked */
  LOCKED = 423,
  /** 424 Failed Dependency – The request failed due to failure of a previous request */
  FAILED_DEPENDENCY = 424,
  /** 425 Too Early – The server is unwilling to risk processing a request that might be replayed */
  TOO_EARLY = 425,
  /** 426 Upgrade Required – The client should switch to a different protocol */
  UPGRADE_REQUIRED = 426,
  /** 428 Precondition Required – The origin server requires the request to be conditional */
  PRECONDITION_REQUIRED = 428,
  /** 429 Too Many Requests – The user has sent too many requests in a given amount of time */
  TOO_MANY_REQUESTS = 429,
  /** 431 Request Header Fields Too Large – The server is unwilling to process the request because header fields are too large */
  REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
  /** 451 Unavailable For Legal Reasons – The user requested a resource that cannot legally be provided */
  UNAVAILABLE_FOR_LEGAL_REASONS = 451,

  // 5xx – Server Errors
  /** 500 Internal Server Error – A generic error message, given when no more specific message is suitable */
  INTERNAL_SERVER_ERROR = 500,
  /** 501 Not Implemented – The server either does not recognize the request method, or it lacks the ability to fulfill the request */
  NOT_IMPLEMENTED = 501,
  /** 502 Bad Gateway – The server was acting as a gateway or proxy and received an invalid response from the upstream server */
  BAD_GATEWAY = 502,
  /** 503 Service Unavailable – The server is currently unavailable */
  SERVICE_UNAVAILABLE = 503,
  /** 504 Gateway Timeout – The server was acting as a gateway or proxy and did not receive a timely response from the upstream server */
  GATEWAY_TIMEOUT = 504,
  /** 505 HTTP Version Not Supported – The server does not support the HTTP protocol version used in the request */
  HTTP_VERSION_NOT_SUPPORTED = 505,
  /** 506 Variant Also Negotiates – Transparent content negotiation for the request results in a circular reference */
  VARIANT_ALSO_NEGOTIATES = 506,
  /** 507 Insufficient Storage – WebDAV: The server is unable to store the representation needed to complete the request */
  INSUFFICIENT_STORAGE = 507,
  /** 508 Loop Detected – WebDAV: The server detected an infinite loop while processing a request */
  LOOP_DETECTED = 508,
  /** 510 Not Extended – Further extensions to the request are required for the server to fulfill it */
  NOT_EXTENDED = 510,
  /** 511 Network Authentication Required – The client needs to authenticate to gain network access */
  NETWORK_AUTHENTICATION_REQUIRED = 511,
}
