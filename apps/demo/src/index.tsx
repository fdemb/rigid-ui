/* @refresh reload */
import { render } from "@solidjs/web";
import { Router } from "./router";
import Layout from "./Layout";
import "./globals.css";

const root = document.getElementById("root");
if (root) {
  render(() => <Router>{(props) => <Layout>{props.children}</Layout>}</Router>, root);
}
