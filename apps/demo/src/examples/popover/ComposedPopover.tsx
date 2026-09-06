import * as stylex from "@stylexjs/stylex";

import { Popover } from "../../components/ui/Popover";
import { tokens } from "../../styles/tokens.stylex";

const styles = stylex.create({
  trigger: {
    borderColor: tokens.accent,
    color: tokens.accent,
  },
  content: {
    backgroundColor: tokens.canvasMuted,
    borderColor: tokens.borderStrong,
  },
});

export default function ComposedPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger xstyle={styles.trigger}>Customized details</Popover.Trigger>
      <Popover.Content xstyle={styles.content}>
        <Popover.Title>Owned styles</Popover.Title>
        <Popover.Description>
          The registry component accepts StyleX overrides without exposing its internal structure.
        </Popover.Description>
      </Popover.Content>
    </Popover.Root>
  );
}
