import { type FC, type ReactNode, useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal as XTerminal } from "@xterm/xterm";
import { cn } from "@/utils";
import useAPI from "@/hooks/use-api";
import useSWR from "swr";
import { GET_DOWNLOAD_LOG } from "@mediago/shared-common";

interface TerminalProps {
  className?: string;
  id: number;
  header?: ReactNode;
}

const Terminal: FC<TerminalProps> = ({ className, id, header }) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const { addIpcListener, removeIpcListener, getDownloadLog } = useAPI();
  const { data } = useSWR({ key: GET_DOWNLOAD_LOG, args: id }, ({ args }) =>
    getDownloadLog(args),
  );

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

    if (data) {
      terminal.write(data);
    }

    const onDownloadMessage = (
      _: unknown,
      messageId: number,
      message: string,
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
  }, [id, data]);

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
