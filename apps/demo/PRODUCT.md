# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Solid developers evaluating Rigid UI and looking for accessible interface building blocks they can use in their applications.

## Product purpose

Rigid UI is an unstyled component library for Solid 2. The demo explains the library, proves its behavior, and provides styled components that developers will eventually be able to vendor into their own applications through a registry.

## Positioning

Rigid UI pairs low-level, unstyled primitives with a separate catalog of finished component recipes. Developers can use the package primitives directly or own and adapt the styled component code in their application.

## Operating context

Developers browse a documentation site, compare styled components with their underlying primitives, inspect examples and APIs, and copy or install the code they need. The styled catalog follows the usage model established by shadcn/ui. Primitive documentation follows the more technical structure used by Base UI.

## Capabilities and constraints

- The library targets the latest Solid 2 release candidate.
- Styled components and unstyled primitives are separate catalog sections.
- Every component and every primitive has its own documentation page.
- Existing primitives include Alert Dialog, Dialog, Popover, Scroll Area, and Tooltip.
- The styled catalog also includes ordinary interface pieces such as Button and Input.
- A component registry is planned but is not yet available. The site must not claim that installation from the registry works today.
- The demo consumes the library through its published exports map and must continue to verify the packaged artifact.

## Brand commitments

The product name is Rigid UI, written as `rigid/ui` in the existing wordmark. The redesigned documentation may replace the current visual identity. The styled component catalog should feel familiar to shadcn/ui users, while primitive pages should favor the technical clarity of Base UI documentation.

## Evidence on hand

- The working library and its tests live in `packages/rigid-ui`.
- Existing demo components and examples live in `apps/demo/src`.
- Base UI source and tests live in `reference/base-ui`.
- No customer claims, testimonials, usage figures, or production registry are available and none should be invented.

## Product principles

- Make the styled and unstyled layers easy to distinguish.
- Give every exported building block a stable, linkable page.
- Teach through working examples and concrete API details.
- Keep component recipes understandable enough for developers to own after vendoring them.
- Treat accessibility and behavior as library contracts, not optional polish.

## Accessibility & inclusion

Documentation and examples must preserve semantic HTML, keyboard access, focus visibility, reduced-motion preferences, and readable contrast.
