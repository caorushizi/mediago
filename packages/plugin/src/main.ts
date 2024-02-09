import "./index.scss";
import "./components";
import { html, render } from "lit";

function bili() {
  const videoCards = document.querySelectorAll(
    ".feed-card .bili-video-card__image--link",
  );
  videoCards.forEach((card) => {
    const banner = document.createElement("welcome-banner");
    banner.name = "bili";
    card.appendChild(banner);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bili();
});

const dialog = html`<one-dialog>
  <span slot="heading">Hello world</span>
  <div>
    <p>
      Lorem ipsum dolor amet tilde bicycle rights affogato brooklyn. Whatever
      lomo subway tile sriracha gastropub edison bulb shabby chic tumeric
      meditation mustache raw denim.
    </p>

    <p>
      reegan ugh bespoke you probably haven't heard of them godard crucifix
      pabst. Selvage biodiesel vice copper mug lumbersexual cred plaid.
      Skateboard pitchfork listicle fashion axe. Chillwave viral butcher vegan
      wolf.
    </p>
  </div>
</one-dialog>`;

render(dialog, document.body);
bili();
