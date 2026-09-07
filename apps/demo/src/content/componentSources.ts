import meterSource from "../components/ui/Meter.tsx?raw";
import badgeSource from "../components/ui/Badge.tsx?raw";
import buttonSource from "../components/ui/Button.tsx?raw";
import cardSource from "../components/ui/Card.tsx?raw";
import dialogSource from "../components/ui/Dialog.tsx?raw";
import inputSource from "../components/ui/Input.tsx?raw";
import labelSource from "../components/ui/Label.tsx?raw";
import popoverSource from "../components/ui/Popover.tsx?raw";
import scrollAreaSource from "../components/ui/ScrollArea.tsx?raw";
import separatorSource from "../components/ui/Separator.tsx?raw";
import skeletonSource from "../components/ui/Skeleton.tsx?raw";
import textareaSource from "../components/ui/Textarea.tsx?raw";
import tooltipSource from "../components/ui/Tooltip.tsx?raw";

export const componentSources: Record<string, string> = {
  meter: meterSource,
  badge: badgeSource,
  button: buttonSource,
  card: cardSource,
  dialog: dialogSource,
  "alert-dialog": dialogSource,
  input: inputSource,
  label: labelSource,
  popover: popoverSource,
  "scroll-area": scrollAreaSource,
  separator: separatorSource,
  skeleton: skeletonSource,
  textarea: textareaSource,
  tooltip: tooltipSource,
};
