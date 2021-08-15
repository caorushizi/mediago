import React, { FC, useEffect, useState } from "react";
import WindowToolBar from "renderer/components/WindowToolBar";
import "./index.scss";
import electron from "renderer/utils/electron";

const Terminal: FC = () => {
  const [messages, setMessage] = useState<string[]>([]);

  const receiveMessage = (e: Electron.IpcRendererEvent, ...ms: string[]) => {
    console.log(123123, messages, ms);
    setMessage((message) => [...message, ...ms]);
  };

  useEffect(() => {
    electron.addEventListener("receive-message", receiveMessage);

    return () => {
      electron.removeEventListener("receive-message", receiveMessage);
    };
  }, []);

  return (
    <div className={"terminal-page"}>
      <WindowToolBar
        color="#000"
        onClose={() => {
          //empty
        }}
      />
      <div className={"content"}>
        {messages.map((item, index) => (
          <p className={"message"} key={index}>
            {item}
          </p>
        ))}
      </div>
    </div>
  );
};

export default Terminal;
