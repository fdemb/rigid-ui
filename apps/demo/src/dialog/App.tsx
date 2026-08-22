import { Dialog } from "rigid-ui/dialog";
import styles from "./App.module.css";

export default function App() {
  return (
    <div class={styles.Page}>
      <h2 class={styles.Heading}>Dialog</h2>

      <div class={styles.Row}>
        <Dialog.Root>
          <Dialog.Trigger class={styles.Button}>Delete project</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop class={styles.Backdrop} />
            <Dialog.Popup class={styles.Popup}>
              <Dialog.Title class={styles.Title}>Delete project?</Dialog.Title>
              <Dialog.Description class={styles.Description}>
                This permanently removes the project and all of its deployments. This action cannot
                be undone.
              </Dialog.Description>
              <div class={styles.Actions}>
                <Dialog.Close class={styles.Close}>Cancel</Dialog.Close>
                <Dialog.Close class={styles.Primary}>Delete</Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>

        <Dialog.Root modal={false}>
          <Dialog.Trigger class={styles.Button}>Non-modal dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup class={styles.Popup} initialFocus={false}>
              <Dialog.Title class={styles.Title}>Non-modal dialog</Dialog.Title>
              <Dialog.Description class={styles.Description}>
                The page behind this dialog stays interactive; focus is not trapped.
              </Dialog.Description>
              <div class={styles.Actions}>
                <Dialog.Close class={styles.Close}>Close</Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
