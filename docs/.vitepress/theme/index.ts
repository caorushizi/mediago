import { h } from "vue";
import Theme from "vitepress/theme";
import "./style/var.css";
import Comments from "./components/Comments.vue";

export default {
  ...Theme,
  Layout() {
    return h(Theme.Layout, null, {
      "doc-after": () => h(Comments),
    });
  },
};
