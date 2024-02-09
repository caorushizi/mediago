import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

// ipcRenderer.invoke("add-download-item", {
//   name: item.name,
//   url: item.url,
//   type: item.type,
// });

@customElement("mediago-app")
export class App extends LitElement {
  static styles = css`
    .mg-app-root {
    }
  `;

  render() {
    return html`<float-button />`;
  }
}
