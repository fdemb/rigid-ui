/* @refresh reload */
import { render } from "@solidjs/web";
import PopoverApp from "./popover/App";
import ScrollAreaApp from "./scroll-area/App";

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
