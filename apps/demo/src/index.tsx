/* @refresh reload */
import { render } from "@solidjs/web";
import PopoverApp from "./popover/App";
import ScrollAreaApp from "./scroll-area/App";
import "./globals.css";

const root = document.getElementById("root");
if (root) {
  render(
    () => (
      <>
        <PopoverApp />
        <ScrollAreaApp />
      </>
    ),
    root,
  );
}
