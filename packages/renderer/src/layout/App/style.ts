import { createStyles } from "antd-style";

export const useStyles = createStyles(({ css, token, cx }) => {
  const hoverButton = cx(css`
    margin-left: auto;
    display: none;
  `);
  return {
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
    extract: css`
      &:hover {
        .${hoverButton} {
          display: block;
        }
      }
    `,
    containerFooter: css`
      padding: 5px 5px 5px 15px;
      background: ${token.colorBgContainer};
      text-align: right;
      border-top: ${token.colorBorderSecondary} solid 1px;
      justify-content: space-between;
      display: flex;
    `,
    hoverButton,
  };
});
