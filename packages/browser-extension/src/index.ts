import { type DownloadTask, DownloadType } from "@mediago/shared-common";

const CARD_SELECTOR = ".bili-video-card__wrap";
const LINK_SELECTOR = ".bili-video-card__image--link";
const TITLE_SELECTOR = ".bili-video-card__info--tit";
const AD_SELECTOR = ".bili-video-card__info--ad";

function showDownloadDialog(items: Omit<DownloadTask, "id">[]) {
  window.electron.browser.showDownloadDialog(items);
}

const STYLES = `
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
  }
  .mg-button:hover {
    background-color: #66b1ff;
    border-color: #66b1ff;
  }
`;

class BilibiliButton extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;

    const button = document.createElement("div");
    button.className = "mg-button";
    button.textContent = "下载";
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Find the parent card from the button's own position in the DOM
      const card = this.closest(CARD_SELECTOR);
      if (!card) return;

      const link = card.querySelector(
        LINK_SELECTOR,
      ) as HTMLAnchorElement | null;
      if (!link) return;

      const url = link.getAttribute("href") || "";
      const name =
        card.querySelector(TITLE_SELECTOR)?.textContent?.trim() || "";

      showDownloadDialog([{ name, url, type: DownloadType.bilibili }]);
    });

    shadow.appendChild(style);
    shadow.appendChild(button);
  }
}

customElements.define("bilibili-button", BilibiliButton);

function injectButtons() {
  const cards = document.querySelectorAll(
    `${CARD_SELECTOR}:not([data-mg-injected])`,
  );

  cards.forEach((card) => {
    if (card.classList.contains("__scale-wrap")) {
      card.setAttribute("data-mg-injected", "skip");
      return;
    }

    if (!card.querySelector(LINK_SELECTOR)) return;

    if (card.querySelector(AD_SELECTOR)) {
      card.setAttribute("data-mg-injected", "ad");
      return;
    }

    card.appendChild(document.createElement("bilibili-button"));
    card.setAttribute("data-mg-injected", "true");
  });
}

if (location.hostname === "www.bilibili.com") {
  injectButtons();

  const observer = new MutationObserver(() => {
    injectButtons();
  });

  const target =
    document.querySelector(".bili-feed4-layout, .container") || document.body;
  observer.observe(target, { childList: true, subtree: true });
}
