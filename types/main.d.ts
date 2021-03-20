declare global {
  namespace NodeJS {
    interface Global {
      __bin__: string;
    }
  }
}

export {};
