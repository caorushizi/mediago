// 视频类型
interface Collection {
  id: string;
  // 视频名称
  title: string;
  // 视频 url
  desc?: string;
  // 收藏的url
  url: string;
  // 是否置顶
  is_favorite?: boolean;
}
