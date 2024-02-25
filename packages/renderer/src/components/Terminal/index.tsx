import React, { FC, useEffect, useRef } from "react";
import { useStyles } from "./style";
import "xterm/css/xterm.css";
import { Terminal as XTerminal } from "xterm";
import classNames from "classnames";
import { Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";

interface TerminalProps {
  className?: string;
  onClose?: () => void;
}

const Terminal: FC<TerminalProps> = ({ className, onClose }) => {
  const { styles } = useStyles();
  const terminalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const terminal = new XTerminal({
      rows: 10,
      fontFamily: "Consolas, 'Courier New', monospace",
    });
    terminal.open(terminalRef.current);
    terminal.write("Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ");

    return () => {
      terminal.dispose();
    };
  }, []);

  return (
    <div ref={terminalRef} className={classNames(className, styles.container)}>
      <Button
        type="text"
        icon={<CloseOutlined />}
        className={styles.closeBtn}
        onClick={onClose}
      />
    </div>
  );
};

export default Terminal;
