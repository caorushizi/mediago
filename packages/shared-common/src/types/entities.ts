// Type definitions for database entities

export interface Conversion {
  id: number;
  name: string;
  path: string;
  createdDate?: Date;
  updatedDate?: Date;
}

export interface Favorite {
  id: number;
  title: string;
  url: string;
  icon?: string;
  createdDate: Date;
  updatedDate: Date;
}

export interface Video {
  id: number;
  name: string;
  type: string;
  url: string;
  folder?: string;
  headers?: string;
  isLive: boolean;
  status: string;
  log: string;
  createdDate: Date;
  updatedDate: Date;
}
