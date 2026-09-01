import * as stylex from "@stylexjs/stylex";

import { Bleed } from "../components/Frame";
import Link from "../components/Link";
import { buttonStyle } from "../components/ui/Button";
import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  root: {
    maxWidth: "34rem",
    paddingBlock: "clamp(4rem, 12vw, 8rem)",
    paddingInline: tokens.inset,
  },
  status: {
    color: tokens.textSubtle,
    fontFamily: tokens.fontMono,
    fontSize: "0.6875rem",
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 650,
    letterSpacing: "-0.03em",
    marginBlock: "0.5rem 0",
  },
  copy: {
    color: tokens.textMuted,
    fontSize: "0.9375rem",
    lineHeight: 1.6,
    marginBlock: "0.6rem 1.4rem",
  },
});

export default function NotFound() {
  return (
    <Bleed bare>
      <div {...stylex.attrs(styles.root)}>
        <p {...stylex.attrs(styles.status)}>404</p>
        <h1 {...stylex.attrs(styles.title)}>Nothing at this path</h1>
        <p {...stylex.attrs(styles.copy)}>The page may have moved or never existed.</p>
        <Link href="/" xstyle={buttonStyle({ size: "sm", variant: "secondary" })}>
          Back to the index
        </Link>
      </div>
    </Bleed>
  );
}
