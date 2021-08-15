function defaultStrat(val1: any, val2: any): any {
  return typeof val2 !== "undefined" ? val2 : val1;
}

const strats = Object.create(null);

export default function mergeConfig(
  config1: RequestOptions,
  config2?: RequestOptions
): RequestOptions {
  if (!config2) {
    config2 = {};
  }

  const config = Object.create(null);

  let key1: keyof RequestOptions;
  for (key1 in config2) {
    mergeField(key1);
  }

  let key2: keyof RequestOptions;
  for (key2 in config1) {
    if (!config2[key2]) {
      mergeField(key2);
    }
  }

  function mergeField(key: keyof RequestOptions): void {
    const strat = strats[key] || defaultStrat;
    config[key] = strat(config1[key], config2?.[key]);
  }

  return config;
}
