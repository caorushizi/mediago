import LRU from "lru-cache";

const options = {
  max: 500,
  maxSize: 5000,
  sizeCalculation: () => {
    return 1;
  },
  ttl: 1000 * 60 * 5,
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
};

const cache = new LRU(options);

export default cache;
