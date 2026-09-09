import { createMemo, createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import { progressStateAttributesMapping } from "./stateAttributesMapping";
import type { PartProps } from "../../utils/domProps";
import { ProgressRootContext, type ProgressRootContextValue } from "./ProgressRootContext";

export type ProgressStatus = "indeterminate" | "progressing" | "complete";

export interface ProgressRootState {
  status: ProgressStatus;
}
export interface ProgressRootProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  ProgressRootState
> {
  value: number | null;
  /** The lower bound. Defaults to 0. */
  min?: number;
  /** The upper bound. Defaults to 100. */
  max?: number;
  format?: Intl.NumberFormatOptions;
  locale?: Intl.LocalesArgument;
  getAriaValueText?: (formattedValue: string, value: number | null) => string;
}

export function ProgressRoot(props: ProgressRootProps) {
  const [labelId, setLabelId] = createSignal<string>();
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 100;
  const progress = createMemo(() => {
    const value = props.value;
    if (value == null || !Number.isFinite(value)) {
      return { status: "indeterminate", percentage: null, value: null, formatted: "" } as const;
    }
    const clamped = Math.max(min(), Math.min(value, max()));
    const rawPercentage = ((value - min()) * 100) / (max() - min());
    const percentage = Math.max(0, Math.min(Number.isNaN(rawPercentage) ? 0 : rawPercentage, 100));
    const status: ProgressStatus = clamped === max() ? "complete" : "progressing";
    const formatted = props.format
      ? new Intl.NumberFormat(props.locale, props.format).format(clamped)
      : new Intl.NumberFormat(props.locale, { style: "percent" }).format(percentage / 100);
    return { status, percentage, value: clamped, formatted };
  });
  const state = (): ProgressRootState => ({ status: progress().status });
  const formattedValue = () => progress().formatted;
  const context: ProgressRootContextValue = {
    formattedValue,
    percentageValue: () => progress().percentage,
    state,
    value: () => props.value,
    registerLabel(id) {
      setLabelId(id);
      return () => setLabelId((current) => (current === id ? undefined : current));
    },
  };

  return (
    <ProgressRootContext value={context}>
      {renderPart<HTMLDivElement, ProgressRootState>("div", props, {
        state,
        stateAttributesMapping: progressStateAttributesMapping,
        props: [
          {
            role: "progressbar",
            get "aria-labelledby"() {
              return labelId();
            },
            get "aria-valuemin"() {
              return min();
            },
            get "aria-valuemax"() {
              return max();
            },
            get "aria-valuenow"() {
              return progress().value ?? undefined;
            },
            get "aria-valuetext"() {
              return props.getAriaValueText
                ? props.getAriaValueText(formattedValue(), props.value)
                : progress().status === "indeterminate"
                  ? "indeterminate progress"
                  : formattedValue();
            },
          },
        ],
        exclude: ["value", "min", "max", "format", "locale", "getAriaValueText"],
        children: () => (
          <>
            {props.children}
            {/* Text content makes NVDA announce the progress label, matching Base UI issue #4184. */}
            <span
              role="presentation"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                "clip-path": "inset(50%)",
                overflow: "hidden",
                "white-space": "nowrap",
                border: 0,
                padding: 0,
                width: "1px",
                height: "1px",
                margin: "-1px",
              }}
            >
              x
            </span>
          </>
        ),
      })}
    </ProgressRootContext>
  );
}

export namespace ProgressRoot {
  export type Props = ProgressRootProps;
  export type State = ProgressRootState;
}
