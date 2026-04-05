import { type FC, type ReactNode, useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal as XTerminal } from "@xterm/xterm";
import { cn } from "@/utils";
import { usePlatform } from "@/hooks/use-platform";
import useSWR from "swr";
import { getDownloadLog } from "@/api/download-task";

interface TerminalProps {
  className?: string;
  id: number;
  header?: ReactNode;
}

const Terminal: FC<TerminalProps> = ({ className, id, header }) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const { on, off } = usePlatform();
  const { data } = useSWR({ key: "download-log", args: id }, ({ args }) =>
    getDownloadLog(args),
  );

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new XTerminal({
      fontFamily: "Consolas, 'Courier New', monospace",
      disableStdin: true,
      cursorBlink: false,
      allowProposedApi: true,
      convertEol: true,
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

    on("download-message", onDownloadMessage);
    window.addEventListener("resize", resize);

    return () => {
      off("download-message", onDownloadMessage);
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
