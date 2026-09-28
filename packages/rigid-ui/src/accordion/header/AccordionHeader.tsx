import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import type { PartProps } from "../../utils/domProps";
import { useAccordionItemContext } from "../item/AccordionItemContext";
import type { AccordionItemState } from "../item/AccordionItemContext";
import { accordionStateAttributesMapping } from "../item/stateAttributesMapping";

export interface AccordionHeaderState extends AccordionItemState {}

export interface AccordionHeaderProps extends PartProps<
  HTMLHeadingElement,
  JSX.HTMLAttributes<HTMLHeadingElement>,
  AccordionHeaderState
> {}

export function AccordionHeader(props: AccordionHeaderProps) {
  const itemContext = useAccordionItemContext();

  return renderPart<HTMLHeadingElement, AccordionHeaderState>("h3", props, {
    state: itemContext!.state,
    stateAttributesMapping: accordionStateAttributesMapping,
  });
}

export namespace AccordionHeader {
  export type State = AccordionHeaderState;
  export type Props = AccordionHeaderProps;
}
