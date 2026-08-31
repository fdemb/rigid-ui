import * as stylex from "@stylexjs/stylex";

import { Tooltip } from "../../components/ui/Tooltip";

const styles = stylex.create({
  tools: { display: "flex", gap: "0.5rem" },
});

function Tool(props: { children: string; description: string }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger>{props.children}</Tooltip.Trigger>
      <Tooltip.Content>{props.description}</Tooltip.Content>
    </Tooltip.Root>
  );
}

export default function BasicTooltip() {
  return (
    <Tooltip.Provider closeDelay={80} delay={500}>
      <div {...stylex.attrs(styles.tools)}>
        <Tool description="Cut selection (⌘X)">Cut</Tool>
        <Tool description="Copy selection (⌘C)">Copy</Tool>
        <Tool description="Paste from clipboard (⌘V)">Paste</Tool>
      </div>
    </Tooltip.Provider>
  );
}
