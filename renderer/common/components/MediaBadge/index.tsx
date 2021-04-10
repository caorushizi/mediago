import React from "react";
import mime from "mime";

interface Props {
  sourceUrl: string;
}

const MediaBadge: React.FC<Props> = (props) => {
  const { sourceUrl } = props;
  console.log(sourceUrl);
  const mimeName = mime.getType(sourceUrl);

  console.log(mimeName);
  return mimeName ? <div>{mimeName}</div> : <div>暂不支持</div>;
};

export default MediaBadge;
