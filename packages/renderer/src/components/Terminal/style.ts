import { createStyles } from "antd-style";

export const useStyles = createStyles(({ css }) => ({
  container: css`
    position: relative;
  `,
  closeBtn: css`
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 10000;
    color: #fff;

    &:hover {
      color: #fff !important;
    }
  `,
}));
