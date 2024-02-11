// import "@spectrum-web-components/button/sp-button.js";
// import "@spectrum-web-components/button/sp-clear-button.js";
// import "@spectrum-web-components/button/sp-close-button.js";
// import "@spectrum-web-components/alert-dialog/sp-alert-dialog.js";
// import "@spectrum-web-components/dialog/sp-dialog-base.js";
import "./components";

function bilibili() {
  const videoCards = document.querySelectorAll(
    ".feed-card .bili-video-card__image--link",
  );
  videoCards.forEach((card) => {
    const banner = document.createElement("one-button");
    card.appendChild(banner);
  });
}

function mount() {
  const app = document.createElement("float-button");
  document.body.appendChild(app);
}

// document.addEventListener("DOMContentLoaded", () => {
//   bilibili();
//   mount();
// });

mount();
bilibili();
