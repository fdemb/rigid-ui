import * as stylex from "@stylexjs/stylex";
import { createSignal } from "solid-js";
import { base } from "../../components/ui/base";
import { themes } from "../../components/ui/themes";
import { colors, controls, radii, typography } from "../../components/ui/tokens.stylex";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Popover } from "../../components/ui/Popover";

const compact = stylex.createTheme(controls, { height: "2.25rem" });
const rounded = stylex.createTheme(radii, { base: "0.875rem" });

const styles = stylex.create({
  root: { display: "grid", gap: "1rem", width: "100%" },
  options: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  panel: {
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderStyle: "solid",
    borderWidth: 1,
    padding: "1.25rem",
  },
  content: { display: "grid", gap: "1rem" },
  field: { display: "grid", gap: "0.5rem" },
  actions: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  note: { color: colors.mutedForeground, fontSize: typography.sm, margin: 0 },
});

export default function ThemePreview() {
  const [isCompact, setCompact] = createSignal(false);
  const [isRounded, setRounded] = createSignal(false);
  const [isDark, setDark] = createSignal(true);
  const container: { current: HTMLDivElement | null } = { current: null };

  return (
    <div {...stylex.attrs(styles.root)}>
      <div {...stylex.attrs(styles.options)}>
        <Button
          size="sm"
          variant="secondary"
          aria-pressed={isCompact() ? "true" : "false"}
          onClick={() => setCompact(!isCompact())}
        >
          Compact controls
        </Button>
        <Button
          size="sm"
          variant="secondary"
          aria-pressed={isRounded() ? "true" : "false"}
          onClick={() => setRounded(!isRounded())}
        >
          Rounder corners
        </Button>
        <Button
          size="sm"
          variant="secondary"
          aria-pressed={isDark() ? "true" : "false"}
          onClick={() => setDark(!isDark())}
        >
          Dark preview
        </Button>
      </div>
      <div {...stylex.attrs(base.root, themes[isDark() ? "dark" : "light"], styles.panel)}>
        <div
          ref={(element) => {
            container.current = element;
          }}
          role="group"
          aria-label="Theme preview"
          {...stylex.attrs(styles.content, isCompact() && compact, isRounded() && rounded)}
        >
          <div {...stylex.attrs(styles.field)}>
            <Label for="theme-project">Project name</Label>
            <Input id="theme-project" value="Production" />
          </div>
          <div {...stylex.attrs(styles.actions)}>
            <Button variant="primary">Save project</Button>
            <Popover.Root>
              <Popover.Trigger>Details</Popover.Trigger>
              <Popover.Content container={container}>
                <Popover.Title>Project details</Popover.Title>
                <Popover.Description>
                  This popup shares the preview's theme and dimensions.
                </Popover.Description>
                <Popover.Close>Close</Popover.Close>
              </Popover.Content>
            </Popover.Root>
            <Badge tone="success">Healthy</Badge>
          </div>
          <p {...stylex.attrs(styles.note)}>
            Shape and density change independently of the color theme.
          </p>
        </div>
      </div>
    </div>
  );
}
