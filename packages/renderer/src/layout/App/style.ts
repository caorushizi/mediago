import { createStyles } from "antd-style";

export const useStyles = createStyles(({ css, token }) => ({
  container: css`
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  `,
  containerSider: css`
    border-right: ${token.colorBorderSecondary} solid 1px;
  `,
  containerInner: css`
    height: 100%;
  `,
  linkItem: css`
    display: flex;
    flex-direction: row;
    align-items: center;
  `,
  containerFooter: css`
    padding: 5px;
    background: ${token.colorBgContainer};
    text-align: right;
    border-top: ${token.colorBorderSecondary} solid 1px;
  `,
}));
