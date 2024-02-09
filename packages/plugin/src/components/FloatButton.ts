import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import logo from "../assets/logo.png";
import { addIpcListener } from "../helper";

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
        right: -9px;
        top: -9px;
        background: red;
        color: #fff;
        border-radius: 50%;
        height: 18px;
        width: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  `;

  @property({ type: Number })
  count = 0;

  @state()
  open = false;

  onClick(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.open = true;
  }

  firstUpdated() {
    addIpcListener("webview-link-message", this.receiveMessage);
  }

  receiveMessage = () => {
    this.count++;
  };

  onClose() {
    this.open = false;
  }

  render() {
    return html`<div class="mg-float-button" @click=${this.onClick}>
        <img class="logo-img" src=${logo} />
        ${this.count > 0 ? html`<span class="badge">${this.count}</span>` : ""}
      </div>
      <one-dialog ?open=${this.open} @dialog-closed=${this.onClose}>
        <span slot="heading">标题</span>
        <div>
          <p>内容</p>
        </div>
      </one-dialog>`;
  }
}
