import React, { FC, useEffect, useRef } from "react";
import { useStyles } from "./styles";
import "@xterm/xterm/css/xterm.css";
import { Terminal as XTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Flex, Typography } from "antd";
import useElectron from "../../hooks/electron";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils";

const { Text } = Typography;

interface TerminalProps {
  className?: string;
  title: string;
  id: number;
  log: string;
}

const Terminal: FC<TerminalProps> = ({ className, title, id, log }) => {
  const { styles } = useStyles();
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const { addIpcListener, removeIpcListener } = useElectron();
  const { t } = useTranslation();

  useEffect(() => {
    const terminal = new XTerminal({
      rows: 5,
      fontFamily: "Consolas, 'Courier New', monospace",
      disableStdin: true,
      cursorBlink: false,
      allowProposedApi: true,
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    if (log) {
      terminal.write(log);
    }

    const onDownloadMessage = (
      _: unknown,
      messageId: number,
      message: string
    ) => {
      if (id === messageId) {
        terminal.write(message);
      }
    };

    const resize = () => {
      fitAddon.fit();
    };

    addIpcListener("download-message", onDownloadMessage);
    window.addEventListener("resize", resize);

    return () => {
      removeIpcListener("download-message", onDownloadMessage);
      window.removeEventListener("resize", resize);
      terminal.dispose();
    };
  }, [id]);

  return (
    <div className={cn(className, styles.container)}>
      <Flex align="center" justify="space-between" className={styles.toolbar}>
        <Text>{title || t("consoleOutput")}</Text>
      </Flex>
      <div ref={terminalRef} />
    </div>
  );
};

export default Terminal;
