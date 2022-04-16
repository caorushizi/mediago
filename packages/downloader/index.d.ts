declare module "m3u8-parser";

declare interface Manifest {
  allowCache: boolean;
  endList: boolean;
  mediaSequence: number;
  discontinuitySequence: number;
  playlistType: string;
  custom: unknown;
  playlists: [
    {
      attributes: unknown;
      Manifest;
    }
  ];
  mediaGroups: {
    AUDIO: {
      "GROUP-ID": {
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
    };
    VIDEO: unknown;
    "CLOSED-CAPTIONS": unknown;
    SUBTITLES: unknown;
  };
  dateTimeString: string;
  dateTimeObject: Date;
  targetDuration: number;
  totalDuration: number;
  discontinuityStarts: [number];
  segments: [
    {
      byterange: {
        length: number;
        offset: number;
      };
      duration: number;
      attributes: unknown;
      discontinuity: number;
      uri: string;
      timeline: number;
      key: {
        method: string;
        uri: string;
        iv: string;
      };
      map: {
        uri: string;
        byterange: {
          length: number;
          offset: number;
        };
      };
      "cue-out": string;
      "cue-out-cont": string;
      "cue-in": string;
      custom: unknown;
    }
  ];
}
