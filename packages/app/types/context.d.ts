import { Video } from "../src/entity/Video";

interface Size {
  width: number;
  height: number;
}

interface MyAPI {
  changeViewSize: (size: Size | undefined) => void;
  getVideoList: () => Promise<Video[]>;
}
