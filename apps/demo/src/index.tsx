/* @refresh reload */
import { render } from "@solidjs/web";
import DialogApp from "./dialog/App";
import PopoverApp from "./popover/App";
import ScrollAreaApp from "./scroll-area/App";
import "./globals.css";

const root = document.getElementById("root");
if (root) {
  render(
    () => (
      <>
        <DialogApp />
        <PopoverApp />
        <ScrollAreaApp />
      </>
    ),
    root,
  );
}
