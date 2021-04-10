import React from "react";
import "./index.scss";
import {
  ArrowLeftOutlined,
  EnterOutlined,
  HomeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import classNames from "classnames";

interface Props {
  onGoBack: () => void;
  onReload: () => void;
  onGoBackHome: () => void;
  onSetting: () => void;
  url: string;
  onUrlChange: (url: string) => void;
  className: string;
}

const SearchBar: React.FC<Props> = (props) => {
  const {
    onGoBack,
    onReload,
    onGoBackHome,
    url,
    onUrlChange,
    className,
    onSetting,
  } = props;
  return (
    <div className={classNames("search-bar", className)}>
      <div className="btn">
        <ArrowLeftOutlined className="icon" onClick={onGoBack} />
      </div>
      <div className="btn">
        <ReloadOutlined className="icon" onClick={onReload} />
      </div>
      <div className="btn">
        <HomeOutlined className="icon home" onClick={onGoBackHome} />
      </div>
      <input
        className="search-inner"
        placeholder="请在此输入网址"
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
      />
      <div className="btn">
        <EnterOutlined className="button" onClick={onSetting} />
      </div>
    </div>
  );
};

export default SearchBar;
