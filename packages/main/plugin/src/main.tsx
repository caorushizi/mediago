import "./index.scss";
import Button from "./components/button.vue";
import { createApp } from "vue";

function bili() {
  console.log("123123123");
  const videoCards = document.querySelectorAll(
    ".feed-card .bili-video-card__image--link",
  );
  console.log(videoCards);
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
