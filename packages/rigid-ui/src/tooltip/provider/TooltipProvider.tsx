import type { Accessor } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  TooltipProviderContext,
  useTooltipProviderContext,
  type TooltipProviderContextValue,
} from "./TooltipProviderContext";

export interface TooltipProviderProps {
  /**
   * Default open delay for tooltips in this group. `undefined` falls back to each tooltip's
   * own default.
   */
  delay?: number;
  /** Default close delay for tooltips in this group. */
  closeDelay?: number;
  children?: JSX.Element;
}

/**
 * Shares hover timing across a group of tooltips. While one tooltip in the group is visible,
 * hovering another trigger opens it without its rest delay and skips its animations, so moving
 * along a toolbar reads as one continuous tooltip rather than a series of fades.
 *
 * Doesn't render its own HTML element.
 */
export function TooltipProvider(props: TooltipProviderProps) {
  const parent = useTooltipProviderContext(true);
  // Membership itself carries no signal: `activeMembers()` re-reads every member's accessor
  // wherever it is used, so each reader dynamically tracks the mounted states it saw. This also
  // keeps registration free of signal writes, which Solid forbids during component setup.
  const members = new Set<() => boolean>();
  const activeMembers: Accessor<number> = () => {
    let count = 0;
    for (const isActive of members) {
      if (isActive()) count += 1;
    }
    return count;
  };

  const context: TooltipProviderContextValue = {
    get delay() {
      return props.delay ?? parent?.delay;
    },
    get closeDelay() {
      return props.closeDelay ?? parent?.closeDelay;
    },
    registerMember(active) {
      members.add(active);
      const unregisterParent = parent?.registerMember(active);
      return () => {
        members.delete(active);
        unregisterParent?.();
      };
    },
    activeMembers,
  };

  return <TooltipProviderContext value={context}>{props.children}</TooltipProviderContext>;
}

export namespace TooltipProvider {
  export type Props = TooltipProviderProps;
}
