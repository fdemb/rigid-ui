import * as stylex from "@stylexjs/stylex";
import { For } from "solid-js";
import { Popover } from "rigid-ui/primitives/popover";

import { Button } from "../../components/ui/Button";
import { popoverArrowStyle } from "../../components/ui/Popover";
import { tokens } from "../../styles/tokens.stylex";

interface Member {
  name: string;
  role: string;
  status: string;
}

const members: Member[] = [
  { name: "Ada Lovelace", role: "Analytical engines", status: "Available until 5pm" },
  { name: "Grace Hopper", role: "Compilers", status: "In a meeting" },
  { name: "Radia Perlman", role: "Networking", status: "Away" },
];

const styles = stylex.create({
  triggers: { display: "flex", flexWrap: "wrap", gap: "0.75rem" },
  positioner: {
    transitionDuration: tokens.durationNormal,
    transitionProperty: "transform",
    transitionTimingFunction: tokens.easing,
  },
  popup: {
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.border,
    borderRadius: tokens.radiusLg,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: tokens.shadowMd,
    color: tokens.text,
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    maxWidth: "min(20rem, var(--available-width))",
    outline: "none",
    padding: "0.9rem",
    // The arrow positions itself against this element.
    position: "relative",
  },
  // The positioner glides between triggers, so the arrow has to glide with it.
  // Its offset along the popup's edge arrives as an inline `left`, which would
  // otherwise snap to the new trigger while the popup was still moving.
  arrow: {
    transitionDuration: tokens.durationNormal,
    transitionProperty: "left",
    transitionTimingFunction: tokens.easing,
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
  },
  title: { fontSize: "0.875rem", fontWeight: 700, margin: 0 },
  copy: { color: tokens.textMuted, fontSize: "0.8rem", margin: 0 },
});

export default function SharedTriggerPopover() {
  return (
    <Popover.Root<Member>>
      {(state) => (
        <>
          <div {...stylex.attrs(styles.triggers)}>
            <For each={members}>
              {(member) => (
                <Popover.Trigger
                  payload={member}
                  render={(props) => <Button {...props}>{member.name}</Button>}
                />
              )}
            </For>
          </div>
          <Popover.Portal>
            <Popover.Positioner {...stylex.attrs(styles.positioner)} align="start" sideOffset={8}>
              <Popover.Popup {...stylex.attrs(styles.popup)}>
                <Popover.Arrow {...stylex.attrs(popoverArrowStyle, styles.arrow)} />
                <Popover.Title {...stylex.attrs(styles.title)}>{state.payload?.name}</Popover.Title>
                <Popover.Description {...stylex.attrs(styles.copy)}>
                  {state.payload?.role}
                </Popover.Description>
                <p {...stylex.attrs(styles.copy)}>{state.payload?.status}</p>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </>
      )}
    </Popover.Root>
  );
}
