import { createMemo, createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import type { PartProps } from "../../utils/domProps";
import { MeterRootContext, type MeterRootContextValue } from "./MeterRootContext";

export interface MeterRootState {}
export interface MeterRootProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  MeterRootState
> {
  value: number;
  /** The lower bound. Defaults to 0. */
  min?: number;
  /** The upper bound. Defaults to 100. */
  max?: number;
  format?: Intl.NumberFormatOptions;
  locale?: Intl.LocalesArgument;
  getAriaValueText?: (formattedValue: string, value: number) => string;
}

export function MeterRoot(props: MeterRootProps) {
  const [labelId, setLabelId] = createSignal<string>();
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 100;
  const clampedValue = () =>
    Math.max(min(), Math.min(Number.isNaN(props.value) ? min() : props.value, max()));
  const percentageValue = createMemo(() => {
    const percentage = ((props.value - min()) * 100) / (max() - min());
    return Math.max(0, Math.min(Number.isNaN(percentage) ? 0 : percentage, 100));
  });
  const formattedValue = createMemo(() =>
    props.format
      ? new Intl.NumberFormat(props.locale, props.format).format(clampedValue())
      : new Intl.NumberFormat(props.locale, { style: "percent" }).format(percentageValue() / 100),
  );
  const context: MeterRootContextValue = {
    formattedValue,
    percentageValue,
    value: () => props.value,
    registerLabel(id) {
      setLabelId(id);
      return () => setLabelId((current) => (current === id ? undefined : current));
    },
  };

  return (
    <MeterRootContext value={context}>
      {renderPart<HTMLDivElement, MeterRootState>("div", props, {
        props: [
          {
            role: "meter",
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
              return clampedValue();
            },
            get "aria-valuetext"() {
              return props.getAriaValueText
                ? props.getAriaValueText(formattedValue(), props.value)
                : formattedValue();
            },
          },
        ],
        exclude: ["value", "min", "max", "format", "locale", "getAriaValueText"],
        children: () => (
          <>
            {props.children}
            {/* Text content makes NVDA announce the meter label, matching Base UI issue #4184. */}
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
    </MeterRootContext>
  );
}

export namespace MeterRoot {
  export type Props = MeterRootProps;
  export type State = MeterRootState;
}
