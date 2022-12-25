import React, { ChangeEvent } from "react";
import "./index.scss";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  HomeOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import classNames from "classnames";

interface Props {
  onGoBack: () => void;
  onReload: () => void;
  onGoBackHome: () => void;
  handleEnter: () => void;
  url: string;
  onUrlChange: (url: string) => void;
  className: string;
  isFav: boolean;
  handleClickFav: () => void;
  isHomePage: boolean;
}

const SearchBar: React.FC<Props> = (props) => {
  const {
    onGoBack,
    onReload,
    onGoBackHome,
    url,
    onUrlChange,
    className,
    handleEnter,
    isFav,
    handleClickFav,
    isHomePage,
  } = props;

  // 搜索框变化
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUrlChange(e.target.value);
  };

  // 搜索框键盘事件
  const handleEnterPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleEnter();
    }
  };

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
      {isHomePage && (
        <div className="btn" onClick={handleClickFav}>
          {isFav ? <StarFilled /> : <StarOutlined />}
        </div>
      )}
      <input
        className="search-inner"
        placeholder="请在此输入网址"
        type="text"
        value={url}
        onKeyPress={handleEnterPress}
        onChange={handleSearchChange}
      />
      <div className="btn">
        <ArrowRightOutlined className="button" onClick={handleEnter} />
      </div>
    </div>
  );
};

export default SearchBar;
