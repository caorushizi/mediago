import {LitElement, html,css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('welcome-banner')
export class WelcomeBanner extends LitElement {
  @property({type: String})
  name = '';

  static styles = css`
  .mg-button {
    color: #fff;
    background-color: #f50;
    border-color: #f50;
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
    z-index: 100;
  }
  `;

  onClick(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    const dialog = document.querySelector('one-dialog')
    if(dialog) {
      dialog.open = true;
    }
  }

  render() {
    return html`<div class='mg-button' @click=${this.onClick}>Hello, ${this.name}</div>`
  }
}
