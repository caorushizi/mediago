import "./components";
import { BILIBILI_DOWNLOAD_BUTTON } from "./helper";
import $ from "jquery";

// 哔哩哔哩
function bilibili() {
  const videoCards = document.querySelectorAll(".bili-video-card");
  videoCards.forEach((card, index) => {
    const imageDOM = card.querySelector(BILIBILI_DOWNLOAD_BUTTON);
    if (!imageDOM) return;

    const oldBtn = imageDOM.querySelectorAll("one-button");
    if (oldBtn.length) return;

    const isAd = $(card).find(".bili-video-card__info--ad");
    if (isAd.length) return;

    const downloadButton = document.createElement("bilibili-button");
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
setInterval(() => {
  bilibili();
}, 3000);
