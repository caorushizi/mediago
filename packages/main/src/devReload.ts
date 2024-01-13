/* eslint-env browser */
interface ScriptProps {
  src?: string;
  textContent?: string;
}
function insertModuleScript({ src, textContent }: ScriptProps) {
  const script = document.createElement("script");
  script.type = "module";
  if (src) {
    script.src = src;
  }
  if (textContent) {
    script.textContent = textContent;
  }
  document.body.appendChild(script);
}

document.addEventListener("DOMContentLoaded", () => {
  // refresh
  insertModuleScript({
    textContent: `import RefreshRuntime from "http://localhost:5173/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
`,
  });
  // vite client
  insertModuleScript({
    src: "http://localhost:5173/@vite/client",
  });
  // components
  insertModuleScript({
    textContent: `import { mount } from "http://localhost:5173/src/main.tsx"
mount()`,
  });
});
