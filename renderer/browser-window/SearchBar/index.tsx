import React from "react";
import "./index.scss";
import {
  ArrowLeftOutlined,
  EnterOutlined,
  HomeOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import classNames from "classnames";
import PropTypes from "prop-types";

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
      <div className="btn" onClick={handleClickFav}>
        {isFav ? <StarFilled /> : <StarOutlined />}
      </div>
      <input
        className="search-inner"
        placeholder="请在此输入网址"
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
      />
      <div className="btn">
        <EnterOutlined className="button" onClick={handleEnter} />
      </div>
    </div>
  );
};

SearchBar.propTypes = {
  onGoBack: PropTypes.func.isRequired,
};

SearchBar.defaultProps = {};

export default SearchBar;
