declare module "m3u8-parser" {
  interface Attribute {
    [key: string]: string | boolean | number | Attribute;
  }

  interface Byterange {
    length: number;
    offset: number;
  }

  interface Key {
    method: string;
    uri: string;
    iv: string;
  }

  interface Map {
    uri: string;
    byterange: Byterange;
  }

  interface Segment {
    byterange: Byterange;
    duration: number;
    attributes: Attribute;
    discontinuity: number;
    uri: string;
    timeline: number;
    key: Key;
    map: Map;
    "cue-out": string;
    "cue-out-cont": string;
    "cue-in": string;
    custom: Attribute;
  }

  interface Playlist {
    attributes: Attribute;
    manifest: Manifest;
    uri: string;
    timeline: number;
  }

  interface AudioGroup {
    [key: string]: {
      NAME: {
        default: boolean;
        autoselect: boolean;
        language: string;
        uri: string;
        instreamId: string;
        characteristics: string;
        forced: boolean;
      };
    };
  }

  interface MediaGroups {
    AUDIO: AudioGroup;
    VIDEO: Attribute;
    "CLOSED-CAPTIONS": Attribute;
    SUBTITLES: Attribute;
  }

  interface Manifest {
    allowCache: boolean;
    endList: boolean;
    mediaSequence: number;
    discontinuitySequence: number;
    playlistType: string;
    custom: Attribute;
    playlists: Playlist[];
    mediaGroups: MediaGroups;
    dateTimeString: string;
    dateTimeObject: Date;
    targetDuration: number;
    totalDuration: number;
    discontinuityStarts: number[];
    segments: Segment[];
  }

  export class Parser {
    constructor();

    push(chunk: string): void;

    end(): void;

    manifest: Manifest;
  }
}
