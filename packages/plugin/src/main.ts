import "./components";
import { BILIBILI_DOWNLOAD_BUTTON } from "./helper";

function bilibili() {
  const videoCards = document.querySelectorAll(BILIBILI_DOWNLOAD_BUTTON);
  videoCards.forEach((card, index) => {
    const downloadButton = document.createElement("one-button");
    downloadButton.index = index;
    card.appendChild(downloadButton);
  });
}

function sniffing() {
  const floatButton = document.createElement("float-button");
  document.body.appendChild(floatButton);
}

sniffing();
bilibili();
