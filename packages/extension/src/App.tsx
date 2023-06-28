import React, { FC, useEffect } from "react";
import "./App.scss";

const App: FC = () => {
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);

  const getImageUrls = (response: any) => {
    console.log("response", response);
    const { imageUrls } = response;
    setImageUrls(imageUrls);
  };

  useEffect(() => {
    chrome.runtime.sendMessage({ action: "getImageUrls" }, getImageUrls);
  }, []);
  return (
    <div>
      {imageUrls.map((url, index) => {
        return <img key={url} src={url} />;
      })}
    </div>
  );
};

export default App;
