import { For } from "solid-js";
import { Popover } from "rigid-ui/popover";
import styles from "./App.module.css";

interface Member {
  name: string;
  role: string;
  status: string;
}

const members: Member[] = [
  { name: "Ada Lovelace", role: "Analytical engines", status: "Available until 5pm" },
  { name: "Grace Hopper", role: "Compilers", status: "In a meeting" },
  { name: "Radia Perlman", role: "Networking", status: "Away" },
];

export default function App() {
  return (
    <div class={styles.Page}>
      <h2 class={styles.Heading}>Popover</h2>

      <div class={styles.Row}>
        <Popover.Root>
          <Popover.Trigger class={styles.Button}>
            <span class={styles.Press}>Notifications</span>
          </Popover.Trigger>
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
            <span class={styles.Press}>Account</span>
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

      <h2 class={styles.Heading} style={{ "margin-top": "40px" }}>
        Shared popup with a payload
      </h2>

      <p class={styles.Note}>
        One <code>Popover.Root</code> serves every trigger. Each trigger carries a payload, and the
        popup reads it to decide what to render — so switching triggers moves the same popup instead
        of building a new one. The move animates; repositioning from scrolling does not.
      </p>

      {/*
        The triggers are rendered inside the payload render prop, which is the arrangement that
        matters most to get right: the render prop is created once, like any component, so
        registering a trigger cannot rebuild the subtree that declares it.
      */}
      <Popover.Root<Member>>
        {(state) => (
          <>
            <div class={styles.Row}>
              <For each={members}>
                {(member) => (
                  <Popover.Trigger class={styles.Button} payload={member}>
                    <span class={styles.Press}>{member.name}</span>
                  </Popover.Trigger>
                )}
              </For>
            </div>

            <Popover.Portal>
              <Popover.Positioner class={styles.Positioner} sideOffset={8} align="start">
                <Popover.Popup class={styles.Popup}>
                  <Popover.Arrow class={styles.Arrow} />
                  {/* `state.payload`, never `({ payload })` — destructuring a props object
                      freezes the value, here as anywhere else in Solid. */}
                  <Popover.Title class={styles.Title}>{state.payload?.name}</Popover.Title>
                  <Popover.Description class={styles.Description}>
                    {state.payload?.role}
                  </Popover.Description>
                  <p class={styles.Status}>{state.payload?.status}</p>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </>
        )}
      </Popover.Root>
    </div>
  );
}
