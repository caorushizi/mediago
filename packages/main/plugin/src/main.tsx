import "./index.scss";
import Button from "./components/button.vue";
import { createApp } from "vue";

function bili() {
  const videoCards = document.querySelectorAll(
    ".feed-card .bili-video-card__image--link",
  );
  videoCards.forEach((card) => {
    const app = document.createElement("div");
    app.id = "Test";
    card.appendChild(app);
    createApp(Button).mount(app);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // mount();
  bili();
});
