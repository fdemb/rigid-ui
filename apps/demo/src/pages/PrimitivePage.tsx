import * as stylex from "@stylexjs/stylex";
import { useParams } from "@solidjs/router";
import { For, Show } from "solid-js";

import Band, { BandHeader } from "../components/Frame";
import Link from "../components/Link";
import Page from "../components/Page";
import { buttonStyle } from "../components/ui/Button";
import { primitives } from "../content/primitives";
import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  code: {
    backgroundColor: tokens.codeBackground,
    color: tokens.codeText,
    display: "block",
    fontSize: "0.8125rem",
    lineHeight: 1.7,
    overflowX: "auto",
    paddingBlock: "1.1rem",
    paddingInline: tokens.inset,
  },
  part: {
    display: "block",
    fontFamily: tokens.fontMono,
    fontSize: "0.75rem",
    paddingBlock: "0.6rem",
    paddingInline: tokens.inset,
    // The band draws the rule under the last part.
    ":not(:last-child)": {
      borderBottomColor: tokens.border,
      borderBottomStyle: "solid",
      borderBottomWidth: 1,
    },
  },
  actions: { display: "flex", flexWrap: "wrap", gap: "0.5rem", paddingBlock: "1.25rem" },
  miss: { color: tokens.textMuted, fontSize: "0.9375rem", paddingBlock: "3rem" },
});

export default function PrimitivePage() {
  const params = useParams();
  const primitive = () => primitives.find((entry) => entry.slug === params.primitive);

  return (
    <Show
      when={primitive()}
      fallback={
        <Band>
          <p {...stylex.attrs(styles.miss)}>
            No primitive is documented at this path.{" "}
            <Link href="/primitives">See all primitives</Link>.
          </p>
        </Band>
      }
    >
      {(entry) => (
        <Page title={entry().name} lede={entry().description}>
          <Band bare>
            <BandHeader title="Import" note={entry().importPath} />
            <code {...stylex.attrs(styles.code)}>
              {`import { ${entry().name.replace(" ", "")} } from "${entry().importPath}";`}
            </code>
          </Band>

          <Band bare>
            <BandHeader title="Anatomy" note={`${entry().anatomy.length} parts`} />
            <For each={entry().anatomy}>
              {(part) => (
                <span
                  {...stylex.attrs(styles.part)}
                >{`${entry().name.replace(" ", "")}.${part}`}</span>
              )}
            </For>
          </Band>

          <Band>
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
          </Band>
        </Page>
      )}
    </Show>
  );
}
