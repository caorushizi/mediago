const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;

const localhostDomainRE = /^localhost[:?\d]*(?:[^:?\d]\S*)?$/;
const nonLocalhostDomainRE = /^[^\s.]+\.\S{2,}$/;

/**
 * Loosely validate a URL `string`.
 *
 * @param {String} string
 * @return {Boolean}
 */

export function isUrl(string: string) {
  if (typeof string !== "string") {
    return false;
  }

  const match = string.match(protocolAndDomainRE);
  if (!match) {
    return false;
  }

  const everythingAfterProtocol = match[1];
  if (!everythingAfterProtocol) {
    return false;
  }

  if (
    localhostDomainRE.test(everythingAfterProtocol) ||
    nonLocalhostDomainRE.test(everythingAfterProtocol)
  ) {
    return true;
  }

  return false;
}
