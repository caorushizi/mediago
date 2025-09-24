const fsExtra = {
  exists: async (_path: string): Promise<boolean> => false,
  writeFile: async (_path: string, _data: string): Promise<void> => undefined,
  readJSON: async (_path: string): Promise<unknown> => ({}),
  readFileSync: (_path: string, _encoding: string): string => "",
};

export default fsExtra;

export const readFileSync = fsExtra.readFileSync;
