import "./components";
import "./App";

function bilibili() {
  const videoCards = document.querySelectorAll(
    ".feed-card .bili-video-card__image--link",
  );
  videoCards.forEach((card) => {
    const banner = document.createElement("one-button");
    banner.name = "bili";
    card.appendChild(banner);
  });
}

function mount() {
  const app = document.createElement("mediago-app");
  document.body.appendChild(app);
}

// document.addEventListener("DOMContentLoaded", () => {
//   bilibili();
//   mount();
// });

mount();
bilibili();
