import { extendTheme } from "@chakra-ui/react";
import Tabs from "./tabs";

const theme = extendTheme({
  components: {
    Tabs,
  },
  styles: {
    global: {
      "*": {
        lineHeight: "tall",
        fontFamily: "Alibaba-PuHuiTi-Regular",
      },
    },
  },
});

export default theme;
