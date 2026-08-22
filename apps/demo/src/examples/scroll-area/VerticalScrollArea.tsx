import { ScrollArea } from "rigid-ui/scroll-area";

export default function VerticalScrollArea() {
  return (
    <ScrollArea.Root class="h-[8.5rem] w-96 max-w-[calc(100vw-8rem)]">
      <ScrollArea.Viewport class="h-full rounded-md outline outline-zinc-200 -outline-offset-1 focus-visible:outline-2 focus-visible:outline-blue-500 dark:outline-zinc-700">
        <ScrollArea.Content class="flex flex-col gap-4 py-3 pl-4 pr-6">
          <p class="m-0 text-sm leading-[1.375rem] text-zinc-900 dark:text-zinc-100">
            Vernacular architecture is building done outside any academic tradition, and without
            professional guidance. It is not a particular architectural movement or style, but
            rather a broad category, encompassing a wide range and variety of building types, with
            differing methods of construction, from around the world, both historical and extant and
            classical and modern.
          </p>
          <p class="m-0 text-sm leading-[1.375rem] text-zinc-900 dark:text-zinc-100">
            This type of architecture usually serves immediate, local needs, is constrained by the
            materials available in its particular region and reflects local traditions and cultural
            practices. The study of vernacular architecture does not examine formally schooled
            architects, but instead that of the design skills and tradition of local builders, who
            were rarely given any attribution for the work.
          </p>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar class="pointer-events-none relative m-2 flex rounded-md opacity-0 transition-opacity duration-150 data-hovering:pointer-events-auto data-hovering:opacity-100 data-scrolling:[transition-duration:0ms] data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-[orientation=vertical]:w-1 data-[orientation=vertical]:justify-center data-[orientation=vertical]:bg-zinc-200 before:absolute before:content-[''] dark:bg-zinc-700">
        <ScrollArea.Thumb class="size-full rounded-[inherit] bg-zinc-400 dark:bg-zinc-400" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
