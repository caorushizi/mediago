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
  headers?: string;
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
    window.addEventListener("resize", this.handleWindowResize);
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);

    this.button = this.renderRoot.querySelector(".mg-float-button");
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

    const react = this.button.getBoundingClientRect();
    if (react.left === 0 && react.top === 0) return;

    const newPos = this.getPosition(react.left, react.top);
    this.button.style.left = `${newPos.left}px`;
    this.button.style.top = `${newPos.top}px`;
  };

  receiveMessage = (_: unknown, data: SourceData) => {
    this.data = [...this.data, { ...data, name: document.title }];
  };

  handleMouseStart = (event: MouseEvent) => {
    if (!this.button) return;

    this.dragging = true;
    this.dragOccurred = false;
    const react = this.button.getBoundingClientRect();
    this.offsetX = event.clientX - react.left;
    this.offsetY = event.clientY - react.top;
  };

  handleMouseUp = () => {
    this.dragging = false;
  };

  getPosition = (
    newLeft: number,
    newTop: number,
  ): { left: number; top: number } => {
    if (!this.button) return { left: 0, top: 0 };

    // Gets the width of the scroll bar
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    // Gets the width and height of the window
    const windowWidth =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;
    const windowHeight =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight;

    // Make sure the buttons don't get dragged off the screen
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

      // Use requestAnimationFrame to optimize performance
      requestAnimationFrame(() => {
        if (!this.button) return;

        const position = this.getPosition(newLeft, newTop);
        this.button.style.left = `${position.left}px`;
        this.button.style.top = `${position.top}px`;
      });
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
  floatButton.style.position = "fixed";
  floatButton.style.zIndex = "9999999999999";
  document.body.appendChild(floatButton);

  // Sends the plug-in prepared message to the main process
  pluginReady();
}

init();
