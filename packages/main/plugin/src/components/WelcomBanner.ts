import {LitElement, html,css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('welcome-banner')
export class WelcomeBanner extends LitElement {
  @property({type: String})
  name = '';

  static styles = css`
  .hi {
    color: red;
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1000;
  }
  `;

  render() {
    return html`<div class='hi'>Hello, ${this.name}</div>`
  }
}
