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

/**
 * 判断URL是否经过编码
 * @param url 需要判断的URL字符串
 * @returns boolean 如果URL被编码返回true，否则返回false
 */
export function isEncodedURL(url: string): boolean {
  // 如果解码后的URL与原URL不同，说明URL被编码过
  return decodeURIComponent(url) !== url;
}
