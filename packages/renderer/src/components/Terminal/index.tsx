import React, { FC, useEffect, useRef } from "react";
import { useStyles } from "./style";
import "xterm/css/xterm.css";
import { Terminal as XTerminal } from "xterm";
import classNames from "classnames";
import { Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import useElectron from "../../hooks/electron";

interface TerminalProps {
  className?: string;
  onClose?: () => void;
}

const Terminal: FC<TerminalProps> = ({ className, onClose }) => {
  const { styles } = useStyles();
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const { addIpcListener, removeIpcListener } = useElectron();

  useEffect(() => {
    const terminal = new XTerminal({
      rows: 10,
      cols: 100,
      fontFamily: "Consolas, 'Courier New', monospace",
    });
    terminal.open(terminalRef.current);

    const onDownloadMessage = (_: unknown, message: string) => {
      terminal.write(message);
    };

    addIpcListener("download-message", onDownloadMessage);

    return () => {
      removeIpcListener("download-message", onDownloadMessage);
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
