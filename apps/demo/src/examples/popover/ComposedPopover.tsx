import type { JSX } from "@solidjs/web";
import { Popover } from "rigid-ui/popover";
import { mergeProps } from "rigid-ui/merge-props";

const control =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium leading-none text-zinc-900 no-underline transition-[transform,background-color] duration-120 ease-out hover:bg-zinc-100 active:scale-[0.96] focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

const popup =
  "relative flex w-max max-w-[min(20rem,var(--available-width))] flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-zinc-900 shadow-[0_1px_1px_rgb(0_0_0/4%),0_8px_24px_rgb(0_0_0/8%)] outline-none [transform-origin:var(--transform-origin)] transition-[transform,opacity] duration-150 ease-out data-[starting-style]:translate-y-1 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-1 data-[ending-style]:opacity-0 data-instant:transition-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const description = "m-0 text-pretty text-sm leading-[1.375rem] text-zinc-500 dark:text-zinc-400";

function BrandButton(props: { tone?: "plain" | "accent" } & JSX.HTMLAttributes<HTMLElement>) {
  return (
    <button
      {...mergeProps(
        {
          class: `${control} ${
            props.tone === "accent" ? "border-blue-500 text-blue-600 dark:text-blue-400" : ""
          }`,
        },
        props,
      )}
    />
  );
}

export default function ComposedPopover() {
  return (
    <div class="flex flex-wrap items-center gap-3">
      <Popover.Root>
        <Popover.Trigger
          nativeButton={false}
          render={(props, state) => (
            <a {...mergeProps(props, { class: control })} href="#composition">
              {state.open ? "Hide the link popover" : "Rendered as a link"}
            </a>
          )}
        />
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup class={popup}>
              <Popover.Title render="h3" class="m-0 text-sm font-semibold leading-5">
                Anchor trigger
              </Popover.Title>
              <Popover.Description class={description}>
                The callback form replaces the element and takes attributes the part itself does not
                declare, like <code>href</code>.
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      <Popover.Root>
        <Popover.Trigger
          render={(props, state) => (
            <BrandButton {...mergeProps(props, { tone: "accent" })}>
              {state.open ? "Close details" : "Open details"}
            </BrandButton>
          )}
        />
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup class={popup}>
              <Popover.Title render="h3" class="m-0 text-sm font-semibold leading-5">
                Custom component
              </Popover.Title>
              <Popover.Description class={description}>
                A render callback can hand the part's props to any component that spreads them, so
                your own design-system button keeps its API.
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
