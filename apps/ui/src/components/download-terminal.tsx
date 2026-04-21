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

    // Copy-on-shortcut. xterm doesn't bind Ctrl+C / Cmd+C to "copy
    // selection" by default (it passes them through as control chars).
    // Since stdin is disabled for this read-only log view, hijacking
    // those keys is safe — when there's a selection we copy it and tell
    // xterm to stop handling the event; otherwise we let it through.
    terminal.attachCustomKeyEventHandler((ev) => {
      if (ev.type !== "keydown") return true;
      const isCopy =
        (ev.ctrlKey || ev.metaKey) &&
        !ev.altKey &&
        !ev.shiftKey &&
        ev.key.toLowerCase() === "c";
      if (!isCopy) return true;
      const sel = terminal.getSelection();
      if (!sel) return true;
      void navigator.clipboard.writeText(sel).catch(() => {
        /* clipboard API may be unavailable in non-secure contexts; ignore */
      });
      ev.preventDefault();
      return false;
    });

    if (data?.log) {
      terminal.write(data.log);
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
