import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import logo from "../assets/logo.png";
import { addIpcListener, showDownloadDialog } from "../helper";

@customElement("float-button")
export class FloatButton extends LitElement {
  static styles = css`
    .mg-float-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      cursor: pointer;
      background: #fff;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      border-radius: 5px;
      height: 50px;
      width: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover {
        background: #f2f2f2;
      }
      .logo-img {
        width: 45px;
        height: 45px;
      }
      .badge {
        position: absolute;
        right: -2px;
        top: -2px;
        background: red;
        color: #fff;
        border-radius: 50%;
        height: 6px;
        width: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  `;

  data: any = {};

  @property({ type: Number })
  count = 0;

  onClick(e: Event) {
    e.preventDefault();
    e.stopPropagation();

    showDownloadDialog({
      name: this.data.name,
      url: this.data.url,
      type: this.data.type,
    });
  }

  firstUpdated() {
    addIpcListener("webview-link-message", this.receiveMessage);
  }

  receiveMessage = (_: any, data: any) => {
    this.count = 1;
    this.data = data;
  };

  render() {
    if (this.count === 0) {
      return html``;
    }

    return html`<div class="mg-float-button" @click=${this.onClick}>
      <img class="logo-img" src=${logo} />
      <span class="badge"></span>
    </div>`;
  }
}
