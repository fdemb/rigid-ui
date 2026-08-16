/* @refresh reload */
import { render } from "@solidjs/web";
import App from "./scroll-area/App";

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
}
