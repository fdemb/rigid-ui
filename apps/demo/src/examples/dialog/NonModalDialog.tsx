import { Dialog } from "rigid-ui/dialog";

const button =
  "inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium leading-none text-zinc-900 transition-[background-color,border-color,transform] duration-120 ease-out hover:bg-zinc-100 active:scale-[0.96] active:bg-zinc-200 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700";

const close =
  "inline-flex min-h-8 min-w-10 cursor-pointer items-center justify-center rounded border border-zinc-300 bg-white px-2.5 text-[13px] font-medium leading-none text-zinc-900 transition-[transform,background-color] duration-120 ease-out hover:bg-zinc-100 active:scale-[0.96] active:bg-zinc-200 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700";

export default function NonModalDialog() {
  return (
    <Dialog.Root modal={false}>
      <Dialog.Trigger class={button}>Non-modal dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Popup
          class="fixed inset-0 m-auto flex h-fit w-fit max-w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 text-zinc-900 shadow-[0_1px_1px_rgb(0_0_0/4%),0_16px_40px_rgb(0_0_0/12%)] outline-none transition-[transform,opacity] duration-150 ease-out data-[starting-style]:scale-[0.97] data-[ending-style]:scale-[0.97] motion-reduce:transition-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          initialFocus={false}
        >
          <Dialog.Title class="m-0 text-balance text-[15px] font-semibold leading-[1.375rem]">
            Non-modal dialog
          </Dialog.Title>
          <Dialog.Description class="m-0 text-pretty text-sm leading-[1.375rem] text-zinc-500 dark:text-zinc-400">
            The page behind this dialog stays interactive; focus is not trapped.
          </Dialog.Description>
          <div class="mt-2 flex justify-end gap-2">
            <Dialog.Close class={close}>Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
