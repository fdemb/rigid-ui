import { Popover } from "../../src/popover/index";
import styles from "./App.module.css";

export default function App() {
  return (
    <div class={styles.Page}>
      <h2 class={styles.Heading}>Popover</h2>

      <div class={styles.Row}>
        <Popover.Root>
          <Popover.Trigger class={styles.Button}>Notifications</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8} align="start">
              <Popover.Popup class={styles.Popup}>
                <Popover.Arrow class={styles.Arrow} />
                <Popover.Title class={styles.Title}>Notifications</Popover.Title>
                <Popover.Description class={styles.Description}>
                  You are all caught up. Good job!
                </Popover.Description>
                <div class={styles.Actions}>
                  <Popover.Close class={styles.Close}>Close</Popover.Close>
                </div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <h2 class={styles.Heading} style={{ "margin-top": "40px" }}>
        Open on hover
      </h2>

      <div class={styles.Row}>
        <Popover.Root>
          <Popover.Trigger class={styles.Button} openOnHover>
            Account
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup class={styles.Popup}>
                <Popover.Arrow class={styles.Arrow} />
                <Popover.Title class={styles.Title}>Signed in</Popover.Title>
                <Popover.Description class={styles.Description}>
                  Hover stays open while the pointer is over the popup.
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}
