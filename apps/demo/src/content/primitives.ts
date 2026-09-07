export const primitives = [
  {
    slug: "meter",
    name: "Meter",
    importPath: "rigid-ui/primitives/meter",
    anatomy: ["Root", "Label", "Track", "Indicator", "Value"],
    description: "A numeric measurement within a known range, with localized value text.",
  },
  {
    slug: "separator",
    name: "Separator",
    importPath: "rigid-ui/primitives/separator",
    anatomy: ["Separator"],
    description: "An accessible separator with horizontal and vertical orientations.",
  },
  {
    slug: "dialog",
    name: "Dialog",
    importPath: "rigid-ui/primitives/dialog",
    anatomy: ["Root", "Trigger", "Portal", "Backdrop", "Popup", "Title", "Description", "Close"],
    description: "Focus-managed modal and non-modal windows with dismissal and scroll locking.",
  },
  {
    slug: "alert-dialog",
    name: "Alert dialog",
    importPath: "rigid-ui/primitives/alert-dialog",
    anatomy: ["Root", "Trigger", "Portal", "Backdrop", "Popup", "Title", "Description", "Close"],
    description: "A modal interruption for decisions that require an explicit response.",
  },
  {
    slug: "popover",
    name: "Popover",
    importPath: "rigid-ui/primitives/popover",
    anatomy: [
      "Root",
      "Trigger",
      "Portal",
      "Positioner",
      "Popup",
      "Arrow",
      "Title",
      "Description",
      "Close",
    ],
    description: "Anchored interactive content with hover intent and Floating UI positioning.",
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    importPath: "rigid-ui/primitives/tooltip",
    anatomy: ["Provider", "Root", "Trigger", "Portal", "Positioner", "Popup", "Arrow"],
    description: "Contextual labels with accessible focus behavior and coordinated delays.",
  },
  {
    slug: "scroll-area",
    name: "Scroll area",
    importPath: "rigid-ui/primitives/scroll-area",
    anatomy: ["Root", "Viewport", "Content", "Scrollbar", "Thumb", "Corner"],
    description: "Custom scrollbar presentation while preserving native scrolling semantics.",
  },
] as const;

export type Primitive = (typeof primitives)[number];
