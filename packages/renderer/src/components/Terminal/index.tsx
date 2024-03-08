import React, { FC, useEffect, useRef } from "react";
import { useStyles } from "./style";
import "xterm/css/xterm.css";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { WebglAddon } from "@xterm/addon-webgl";
import classNames from "classnames";
import { Button, Flex, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import useElectron from "../../hooks/electron";

const { Text } = Typography;

interface TerminalProps {
  className?: string;
  onClose?: () => void;
  title: string;
}

const Terminal: FC<TerminalProps> = ({ className, onClose, title }) => {
  const { styles } = useStyles();
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const { addIpcListener, removeIpcListener } = useElectron();

  useEffect(() => {
    const terminal = new XTerminal({
      rows: 10,
      fontFamily: "Consolas, 'Courier New', monospace",
      disableStdin: true,
      cursorBlink: false,
      allowProposedApi: true,
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    const unicode11Addon = new Unicode11Addon();
    terminal.loadAddon(unicode11Addon);
    terminal.unicode.activeVersion = "11";
    terminal.loadAddon(new WebglAddon());
    terminal.open(terminalRef.current);
    fitAddon.fit();

    const onDownloadMessage = (_: unknown, message: string) => {
      terminal.write(message);
    };

    addIpcListener("download-message", onDownloadMessage);

    console.log(terminal.cols, terminal.rows);

    return () => {
      removeIpcListener("download-message", onDownloadMessage);
      terminal.dispose();
    };
  }, []);

  return (
    <div className={classNames(className, styles.container)}>
      <Flex align="center" justify="space-between" className={styles.toolbar}>
        <Text>{title}</Text>
        <Button
          type="text"
          icon={<CloseOutlined />}
          className={styles.closeBtn}
          onClick={onClose}
        />
      </Flex>
      <div ref={terminalRef} />
    </div>
  );
};

export default Terminal;
