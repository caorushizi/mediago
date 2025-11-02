import { useRef, useEffect } from "react";
import Input, { TextAreaProps } from "antd/es/input";
import { cn } from "@/utils";

const { TextArea } = Input;

export interface BatchUrlTextareaProps extends TextAreaProps {}

export function BatchUrlTextarea({
  className,
  ...props
}: BatchUrlTextareaProps) {
  const textareaRef = useRef<any>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (
        textareaRef.current?.resizableTextArea?.textArea &&
        highlightRef.current
      ) {
        const textarea = textareaRef.current.resizableTextArea.textArea;
        highlightRef.current.scrollTop = textarea.scrollTop;
        highlightRef.current.scrollLeft = textarea.scrollLeft;
      }
    };

    const textarea = textareaRef.current?.resizableTextArea?.textArea;
    if (textarea) {
      textarea.addEventListener("scroll", handleScroll);
      return () => textarea.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const renderHighlightedText = () => {
    const text = String(props.value || "");
    const parts = text.split(" ");

    return (
      <>
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="bg-yellow-500"> </span>
            )}
          </span>
        ))}
        {text.endsWith("\n") && <br />}
      </>
    );
  };

  return (
    <div className="relative inline-block w-full">
      <div
        ref={highlightRef}
        className="z-1 whitespace-pre wrap-break-word absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden py-1 px-[11px] border border-transparent text-transparent"
      >
        {renderHighlightedText()}
      </div>
      <TextArea
        ref={textareaRef}
        {...props}
        className={cn("z-2 bg-transparent! relative", className)}
      />
    </div>
  );
}
