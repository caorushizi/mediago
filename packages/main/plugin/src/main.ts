import "./index.scss";
import './components'

function bili() {
  const videoCards = document.querySelectorAll(
    ".feed-card .bili-video-card__image--link",
  );
  videoCards.forEach((card) => {
    const banner = document.createElement("welcome-banner");
    banner.name = 'bili'
    card.appendChild(banner);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bili();
});
bili();
