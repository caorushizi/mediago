interface Window {
  myAPI: myAPI;
}

interface Size {
  width: number;
  height: number;
}

interface myAPI {
  changeViewSize: ({ width, height }: Size | undefined) => void;
  getVideoList: () => Promise<Video[]>;
}
