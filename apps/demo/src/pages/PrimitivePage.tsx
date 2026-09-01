import * as stylex from "@stylexjs/stylex";
import { useParams } from "@solidjs/router";
import { For, Show } from "solid-js";

import Link from "../components/Link";
import Page from "../components/Page";
import { buttonStyle } from "../components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { primitives } from "../content/primitives";
import { tokens } from "../styles/tokens.stylex";
import NotFound from "./NotFound";

const styles = stylex.create({
  code: {
    backgroundColor: tokens.codeBackground,
    borderRadius: tokens.radiusMd,
    color: tokens.codeText,
    display: "block",
    fontSize: "0.8125rem",
    overflowX: "auto",
    lineHeight: 1.7,
    padding: "1rem",
  },
  parts: {
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    display: "grid",
  },
  part: {
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    fontFamily: tokens.fontMono,
    fontSize: "0.8125rem",
    paddingBlock: "0.65rem",
  },
  actions: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
});

export default function PrimitivePage() {
  const params = useParams();
  const primitive = () => primitives.find((entry) => entry.slug === params.primitive);

  return (
    <Show when={primitive()} fallback={<NotFound />}>
      {(entry) => (
        <Page title={entry().name} lede={entry().description}>
          <Card>
            <CardHeader divided>
              <CardTitle>Import</CardTitle>
            </CardHeader>
            <CardBody>
              <code {...stylex.attrs(styles.code)}>
                {`import { ${entry().name.replace(" ", "")} } from "${entry().importPath}";`}
              </code>
            </CardBody>
          </Card>

          <Card>
            <CardHeader divided>
              <CardTitle>Anatomy</CardTitle>
            </CardHeader>
            <CardBody>
              <div {...stylex.attrs(styles.parts)}>
                <For each={entry().anatomy}>
                  {(part) => (
                    <span
                      {...stylex.attrs(styles.part)}
                    >{`${entry().name.replace(" ", "")}.${part}`}</span>
                  )}
                </For>
              </div>
            </CardBody>
          </Card>

          <div {...stylex.attrs(styles.actions)}>
            <Link
              href={`/components/${entry().slug}`}
              xstyle={buttonStyle({ size: "sm", variant: "secondary" })}
            >
              See the styled component
            </Link>
            <Link href="/primitives" xstyle={buttonStyle({ size: "sm", variant: "ghost" })}>
              All primitives
            </Link>
          </div>
        </Page>
      )}
    </Show>
  );
}
