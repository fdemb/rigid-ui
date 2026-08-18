import { ScrollArea, type ScrollAreaRootProps } from "../src/scroll-area";

interface ScrollAreaFixtureProps {
  contentHeight?: number;
  contentWidth?: number;
  keepMounted?: boolean;
  rootProps?: Omit<ScrollAreaRootProps, "children" | "ref">;
}

export function ScrollAreaFixture(props: ScrollAreaFixtureProps) {
  return (
    <ScrollArea.Root
      data-testid="root"
      {...props.rootProps}
      style={{
        position: "relative",
        width: "200px",
        height: "200px",
        ...(typeof props.rootProps?.style === "object" ? props.rootProps.style : {}),
      }}
    >
      <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
        <ScrollArea.Content
          data-testid="content"
          style={{
            width: `${props.contentWidth ?? 1000}px`,
            height: `${props.contentHeight ?? 1000}px`,
          }}
        />
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        data-testid="scrollbar-y"
        keepMounted={props.keepMounted}
        style={{ width: "10px" }}
      >
        <ScrollArea.Thumb data-testid="thumb-y" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar
        data-testid="scrollbar-x"
        orientation="horizontal"
        keepMounted={props.keepMounted}
        style={{ height: "10px" }}
      >
        <ScrollArea.Thumb data-testid="thumb-x" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner data-testid="corner" />
    </ScrollArea.Root>
  );
}
