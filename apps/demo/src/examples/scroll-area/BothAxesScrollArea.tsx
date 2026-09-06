import * as stylex from "@stylexjs/stylex";

import { ScrollArea } from "../../components/ui/ScrollArea";
import { tokens } from "../../styles/tokens.stylex";

const styles = stylex.create({
  root: { height: "20rem", maxWidth: "calc(100vw - 5rem)", width: "20rem" },
  content: { padding: "1rem" },
  grid: {
    display: "grid",
    gap: "0.7rem",
    gridTemplateColumns: "repeat(10, 6rem)",
    gridTemplateRows: "repeat(10, 6rem)",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  cell: {
    alignItems: "center",
    backgroundColor: tokens.surfaceInteractive,
    borderRadius: tokens.radiusMd,
    color: tokens.textMuted,
    display: "flex",
    fontSize: "0.8rem",
    fontWeight: 650,
    justifyContent: "center",
  },
});

export default function BothAxesScrollArea() {
  return (
    <ScrollArea.Root xstyle={styles.root}>
      <ScrollArea.Viewport>
        <ScrollArea.Content xstyle={styles.content}>
          <ul {...stylex.attrs(styles.grid)}>
            {Array.from({ length: 100 }, (_, index) => (
              <li {...stylex.attrs(styles.cell)}>{index + 1}</li>
            ))}
          </ul>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar>
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar orientation="horizontal">
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  );
}
