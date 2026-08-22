import { Popover } from "rigid-ui/popover";

const trigger =
  "group inline-flex cursor-pointer select-none rounded-md bg-transparent p-0 text-sm font-medium leading-none text-zinc-900 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-100";

const press =
  "inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 transition-[transform,background-color,border-color] duration-120 ease-out group-hover:bg-zinc-100 group-active:scale-[0.96] group-active:bg-zinc-200 group-data-pressed:bg-zinc-100 motion-reduce:[transition-property:background-color,border-color] dark:border-zinc-700 dark:bg-zinc-900 dark:group-hover:bg-zinc-800 dark:group-active:bg-zinc-700 dark:group-data-pressed:bg-zinc-800";

const popup =
  "relative flex w-max max-w-[min(20rem,var(--available-width))] flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-zinc-900 shadow-[0_1px_1px_rgb(0_0_0/4%),0_8px_24px_rgb(0_0_0/8%)] outline-none [transform-origin:var(--transform-origin)] transition-[transform,opacity] duration-150 ease-out data-[starting-style]:translate-y-1 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[ending-style]:translate-y-1 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-instant:transition-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const arrow =
  "h-1.5 w-3 overflow-clip data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=inline-start]:right-[-9px] data-[side=inline-start]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=inline-end]:left-[-9px] data-[side=inline-end]:-rotate-90 before:absolute before:bottom-0 before:left-1/2 before:size-[calc(6px*sqrt(2))] before:-translate-x-1/2 before:translate-y-1/2 before:rotate-45 before:border before:border-zinc-200 before:bg-white before:content-[''] dark:before:border-zinc-700 dark:before:bg-zinc-900";

export default function HoverPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger class={trigger} openOnHover>
        <span class={press}>Account</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup class={popup}>
            <Popover.Arrow class={arrow} />
            <Popover.Title class="m-0 text-balance text-sm font-semibold leading-5">
              Signed in
            </Popover.Title>
            <Popover.Description class="m-0 text-pretty text-sm leading-[1.375rem] text-zinc-500 dark:text-zinc-400">
              Hover stays open while the pointer is over the popup.
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
