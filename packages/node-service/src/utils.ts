export function isPrivateIPv4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
  );
}

export function looksVirtual(name: string, mac: string) {
  const lower = name.toLowerCase();
  const macLower = mac.toLowerCase();

  // Interface-name keywords that commonly indicate a virtual adapter.
  const virtualKeywords = [
    "virtual",
    "vmware",
    "hyper-v",
    "vbox",
    "veth",
    "bridge",
    "wsl",
    "tap",
    "tunnel",
    "vpn",
    "mihomo",
    "loopback",
    "docker",
    "hamachi",
  ];

  if (virtualKeywords.some((k) => lower.includes(k))) return true;
  if (macLower === "00:00:00:00:00:00") return true;

  return false;
}
