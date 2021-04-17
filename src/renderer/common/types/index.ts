enum SourceStatus {
  Ready = "ready",
  Downloading = "downloading",
  Failed = "failed",
  Success = "success",
}

enum SourceType {
  M3u8 = "m3u8",
  M4s = "m4s",
}

export { SourceStatus, SourceType };
