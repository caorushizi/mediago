import { type FC, type ReactNode, useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal as XTerminal } from "@xterm/xterm";
import useElectron from "@/hooks/use-electron";
import { cn } from "@/utils";

interface TerminalProps {
  className?: string;
  id: number;
  log: string;
  header?: ReactNode;
}

const Terminal: FC<TerminalProps> = ({ className, id, log, header }) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const { addIpcListener, removeIpcListener } = useElectron();

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new XTerminal({
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
    <div className={cn("flex flex-col", className)}>
      {header}
      <div className="flex-1">
        <div ref={terminalRef} />
      </div>
    </div>
  );
};

export default Terminal;
