/**
 * 适用于 m3u8 视频下载的浮动按钮
 */
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import logo from "../assets/logo.png";
import {
  addIpcListener,
  pluginReady,
  removeIpcListener,
  showDownloadDialog,
} from "../helper";
import { DownloadType } from "../../../main/types/interfaces";
import { classMap } from "lit/directives/class-map.js";

interface SourceData {
  id: number;
  url: string;
  documentURL: string;
  name: string;
  type: DownloadType;
}

@customElement("float-button")
export class FloatButton extends LitElement {
  static styles = css`
    .mg-float-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999999;
      cursor: pointer;
      background: #fff;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.3s ease-in-out;
      border-radius: 5px;
      height: 50px;
      width: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      visibility: hidden;
      &.show {
        visibility: visible;
      }
      &:hover {
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
      }
      .logo-img {
        width: 45px;
        height: 45px;
        flex: 1;
      }
      .badge {
        position: absolute;
        right: -5px;
        top: -5px;
        background: red;
        color: #fff;
        border-radius: 50%;
        height: 16px;
        width: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      }
    }
  `;

  @property({ type: Array })
  private data: SourceData[] = [];

  private dragging = false;
  private dragOccurred: boolean = false;
  private top: number = 0;
  private left: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private button: HTMLElement | null = null;

  onClick() {
    if (this.dragOccurred) return;
    if (!this.data) return;

    showDownloadDialog(this.data);
  }

  firstUpdated() {
    addIpcListener("webview-link-message", this.receiveMessage);

    this.button = this.renderRoot.querySelector(".mg-float-button");
    if (this.button) {
      const react = this.button.getBoundingClientRect();
      this.top = react.top;
      this.left = react.left;
    }

    window.addEventListener("resize", this.handleWindowResize);
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    removeIpcListener("webview-link-message", this.receiveMessage);
    window.removeEventListener("resize", this.handleWindowResize);
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  handleWindowResize = () => {
    if (!this.button) return;

    const { left, top } = this.getPosition(this.left, this.top);

    this.left = left;
    this.top = top;

    this.button.style.left = `${this.left}px`;
    this.button.style.top = `${this.top}px`;
  };

  receiveMessage = (_: unknown, data: SourceData) => {
    this.data = [...this.data, data];
  };

  handleMouseStart = (event: MouseEvent) => {
    this.dragging = true;
    this.dragOccurred = false;
    this.offsetX = event.clientX - this.left;
    this.offsetY = event.clientY - this.top;
  };

  handleMouseUp = () => {
    this.dragging = false;
  };

  getPosition = (newLeft: number, newTop: number) => {
    if (!this.button) return { left: 0, top: 0 };

    // 获取滚动条的宽度
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    // 获取窗口的宽度和高度
    const windowWidth =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;
    const windowHeight =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight;

    // 确保按钮不会被拖出屏幕
    if (newLeft < 0) {
      newLeft = 0;
    } else if (
      newLeft + this.button.offsetWidth >
      windowWidth - scrollbarWidth
    ) {
      newLeft = windowWidth - this.button.offsetWidth - scrollbarWidth;
    }

    if (newTop < 0) {
      newTop = 0;
    } else if (newTop + this.button.offsetHeight > windowHeight) {
      newTop = windowHeight - this.button.offsetHeight;
    }

    return {
      left: newLeft,
      top: newTop,
    };
  };

  handleMouseMove = (event: MouseEvent) => {
    if (this.dragging && this.button) {
      this.dragOccurred = true;
      const newLeft = event.clientX - this.offsetX;
      const newTop = event.clientY - this.offsetY;

      const { left, top } = this.getPosition(newLeft, newTop);
      this.left = left;
      this.top = top;
      this.button.style.left = `${this.left}px`;
      this.button.style.top = `${this.top}px`;
    }
  };

  render() {
    const classes = {
      "mg-float-button": true,
      show: this.data.length > 0,
    };

    return html`<div
      @click=${this.onClick}
      @mousedown=${this.handleMouseStart}
      draggable="false"
      class=${classMap(classes)}
    >
      <img class="logo-img" src=${logo} draggable="false" />
      <span class="badge">${this.data.length}</span>
    </div>`;
  }
}

function init() {
  const floatButton = document.createElement("float-button");
  document.body.appendChild(floatButton);

  // 向主进程发送插件准备好的消息
  pluginReady();
}

init();
