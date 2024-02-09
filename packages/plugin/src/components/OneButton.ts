import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("one-button")
export class OneButton extends LitElement {
  @property({ type: String })
  name = "";

  @state()
  open = false;

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
    this.open = true;
  }

  onClose() {
    this.open = false;
  }

  render() {
    return html`<div class="mg-button" @click=${this.onClick}>下载</div>
      <one-dialog ?open=${this.open} @dialog-closed=${this.onClose}>
        <span slot="heading">标题</span>
        <div>
          <p>内容</p>
        </div>
      </one-dialog>`;
  }
}
