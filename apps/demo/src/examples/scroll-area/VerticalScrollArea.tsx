import * as stylex from "@stylexjs/stylex";

import { ScrollArea } from "../../components/ui/ScrollArea";

const styles = stylex.create({
  root: { height: "9rem", maxWidth: "calc(100vw - 5rem)", width: "25rem" },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1rem 1.5rem 1rem 1rem",
  },
  paragraph: { fontSize: "0.875rem", lineHeight: 1.6, margin: 0 },
});

export default function VerticalScrollArea() {
  return (
    <ScrollArea.Root xstyle={styles.root}>
      <ScrollArea.Viewport>
        <ScrollArea.Content xstyle={styles.content}>
          <p {...stylex.attrs(styles.paragraph)}>
            Vernacular architecture is building done outside any academic tradition and without
            professional guidance. It spans a wide range of local building methods and materials.
          </p>
          <p {...stylex.attrs(styles.paragraph)}>
            These structures serve immediate needs and reflect the traditions of their place. Their
            design knowledge belongs to generations of local builders.
          </p>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar>
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
