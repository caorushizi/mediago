import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { BILIBILI_DOWNLOAD_BUTTON, downloadItem } from "../helper";
import $ from "jquery";

@customElement("one-button")
export class OneButton extends LitElement {
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
    downloadItem({ name, url, type: "bilibili" });
  }

  render() {
    return html`<div class="mg-button" @click=${this.onClick}>下载</div>`;
  }
}
