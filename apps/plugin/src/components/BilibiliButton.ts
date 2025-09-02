import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { BILIBILI_DOWNLOAD_BUTTON, showDownloadDialog } from "../helper";
import $ from "jquery";
import { DownloadType } from "../types";

let videoIndex = 0;
@customElement("bilibili-button")
export class BilibiliButton extends LitElement {
  @property({ type: Number })
  index = 0;

  static styles = css`
    .mg-button {
      color: #fff;
      background-color: #409eff;
      border-color: #409eff;
      padding: 0 5px;
      border-radius: 4px;
      cursor: pointer;
      display: inline-block;
      text-align: center;
      text-decoration: none;
      outline: none;
      font-size: 14px;
      line-height: 1.5;
      position: absolute;
      top: 5px;
      right: 5px;
      z-index: 30;
      &:hover {
        background-color: #66b1ff;
        border-color: #66b1ff;
      }
    }
  `;

  onClick(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    const videoImage = $(BILIBILI_DOWNLOAD_BUTTON).eq(this.index);
    const url = videoImage.attr("href") || "";
    const name = videoImage.parent().find(".bili-video-card__info--tit").text();
    showDownloadDialog([{ name, url, type: DownloadType.bilibili }]);
  }

  render() {
    return html`<div class="mg-button" @click=${this.onClick}>下载</div>`;
  }
}

function bilibili() {
  const videoCards = document.querySelectorAll(".bili-video-card__wrap");
  // Clean up all the old buttons first
  if (document.querySelectorAll("bilibili-button").length > 0) {
    videoCards.forEach((card) => {
      const oldButtons = card.querySelectorAll("bilibili-button");
      oldButtons.forEach((button) => button.remove());
    });
  }

  videoCards.forEach((card) => {
    if (card.classList.contains("__scale-wrap")) {
      return;
    }

    const imageDOM = card.querySelector(BILIBILI_DOWNLOAD_BUTTON);
    if (!imageDOM) return;

    const oldBtn = card.querySelectorAll("bilibili-button");
    if (oldBtn.length) return;

    // AD skip, handle index
    const isAd = card.querySelectorAll(".bili-video-card__info--ad");
    if (isAd.length > 0) {
      videoIndex++;
      return;
    }
    const downloadButton = document.createElement("bilibili-button");
    downloadButton.index = videoIndex;
    card.appendChild(downloadButton);
    videoIndex++;
  });
  videoIndex = 0;
}

if (location.hostname === "www.bilibili.com") {
  bilibili();
  setInterval(() => {
    bilibili();
  }, 3000);
  // When you resize, the element changes
  window.addEventListener("resize", () => {
    bilibili();
  });
}
