import { createContext, useContext } from "solid-js";

export const DialogPortalContext = createContext<boolean>();

export function useDialogPortalContext() {
  const keepMounted = useContext(DialogPortalContext);
  if (keepMounted === undefined) {
    throw new Error("Rigid UI: <Dialog.Portal> is missing.");
  }
  return keepMounted;
}
