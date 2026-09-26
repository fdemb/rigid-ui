import * as stylex from "@stylexjs/stylex";

import { Popover } from "../../components/ui/Popover";
import { colors } from "../../components/ui/tokens.stylex";
import { siteColors } from "../../styles/site.stylex";

const styles = stylex.create({
  trigger: {
    borderColor: colors.primary,
    color: colors.primary,
  },
  content: {
    backgroundColor: siteColors.canvasMuted,
    borderColor: colors.borderStrong,
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
