import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';


@customElement('one-dialog')
export class OneDialog extends LitElement {
  @property({type: Boolean})
  open = false;

  static get styles() {
    return [css`.wrapper {
        opacity: 0;
        transition: visibility 0s, opacity 0.25s ease-in;
      }
      .wrapper:not(.open) {
        visibility: hidden;
      }
      .wrapper.open {
        align-items: center;
        display: flex;
        justify-content: center;
        height: 100vh;
        position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        opacity: 1;
        visibility: visible;
      }
      .overlay {
        background: rgba(0, 0, 0, 0.8);
        height: 100%;
        position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
        width: 100%;
      }
      .dialog {
        background: #ffffff;
        max-width: 600px;
        padding: 1rem;
        position: fixed;
      }
      button {
        all: unset;
        cursor: pointer;
        font-size: 1.25rem;
        position: absolute;
          top: 1rem;
          right: 1rem;
      }
      button:focus {
        border: 2px solid blue;
      }`];
  }

  firstUpdated() {
  }

  render() {
    return html`
    <div class="wrapper ${this.open ? 'open' : ''}" aria-hidden="${!this.open}">
    <div class="overlay" @click="${this.close}"></div>
      <div class="dialog" role="dialog" aria-labelledby="title" aria-describedby="content">
        <button class="close" aria-label="Close" @click=${this.close}>✖️</button>
        <h1 id="title"><slot name="heading"></slot></h1>
        <div id="content" class="content">
          <slot></slot>
        </div>
      </div>
    </div>`;
  }


  close() {
    this.open = false
    const closeEvent = new CustomEvent('dialog-closed');
    this.dispatchEvent(closeEvent);
  }

}
