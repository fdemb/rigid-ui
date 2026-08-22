import { ScrollArea } from "rigid-ui/scroll-area";

const scrollbar =
  "pointer-events-none relative m-2 flex rounded-md opacity-0 transition-opacity duration-150 data-hovering:pointer-events-auto data-hovering:opacity-100 data-scrolling:[transition-duration:0ms] data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:bg-zinc-200 data-[orientation=vertical]:w-1 data-[orientation=vertical]:justify-center data-[orientation=vertical]:bg-zinc-200 before:absolute before:content-[''] data-[orientation=vertical]:before:h-full data-[orientation=vertical]:before:left-1/2 data-[orientation=vertical]:before:w-5 data-[orientation=vertical]:before:-translate-x-1/2 data-[orientation=horizontal]:before:-bottom-2 data-[orientation=horizontal]:before:left-0 data-[orientation=horizontal]:before:right-0 data-[orientation=horizontal]:before:h-5 dark:bg-zinc-700";

export default function BothAxesScrollArea() {
  return (
    <ScrollArea.Root class="size-80 max-w-[calc(100vw-8rem)]">
      <ScrollArea.Viewport class="h-full rounded-md outline outline-zinc-200 -outline-offset-1 focus-visible:outline-2 focus-visible:outline-blue-500 dark:outline-zinc-700">
        <ScrollArea.Content class="p-5">
          <ul class="m-0 grid list-none grid-cols-[repeat(10,6.25rem)] grid-rows-[repeat(10,6.25rem)] gap-3 p-0">
            {Array.from({ length: 100 }, (_, i) => (
              <li class="flex items-center justify-center rounded-lg bg-zinc-100 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {i + 1}
              </li>
            ))}
          </ul>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar class={scrollbar}>
        <ScrollArea.Thumb class="size-full rounded-[inherit] bg-zinc-400" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar class={scrollbar} orientation="horizontal">
        <ScrollArea.Thumb class="size-full rounded-[inherit] bg-zinc-400" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  );
}
