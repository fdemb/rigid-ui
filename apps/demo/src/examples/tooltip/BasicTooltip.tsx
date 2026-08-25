import { Tooltip } from "rigid-ui/tooltip";

const trigger =
  "inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 transition-[transform,background-color] duration-120 hover:bg-zinc-100 active:scale-[0.96] active:bg-zinc-200 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700";

const popup =
  "rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white shadow-md [transform-origin:var(--transform-origin)] transition-[transform,opacity] duration-120 data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0 data-instant:transition-none dark:bg-zinc-100 dark:text-zinc-900";

const arrow =
  "h-1.5 w-3 overflow-clip data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=inline-start]:right-[-9px] data-[side=inline-start]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=inline-end]:left-[-9px] data-[side=inline-end]:-rotate-90 before:absolute before:bottom-0 before:left-1/2 before:size-[calc(6px*sqrt(2))] before:-translate-x-1/2 before:translate-y-1/2 before:rotate-45 before:bg-zinc-900 before:content-[''] dark:before:bg-zinc-100";

function Tool(props: { children: string; description: string }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger class={trigger}>{props.children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8}>
          <Tooltip.Popup class={popup}>
            <Tooltip.Arrow class={arrow} />
            {props.description}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export default function BasicTooltip() {
  return (
    <Tooltip.Provider delay={500} closeDelay={80}>
      <div class="flex gap-2">
        <Tool description="Cut selection (⌘X)">Cut</Tool>
        <Tool description="Copy selection (⌘C)">Copy</Tool>
        <Tool description="Paste from clipboard (⌘V)">Paste</Tool>
      </div>
    </Tooltip.Provider>
  );
}
