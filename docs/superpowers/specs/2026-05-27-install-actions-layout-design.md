# Install Actions Layout Design

## Goal

Prevent the three browser installation actions from appearing as an awkward two-row
button cluster in both the homepage hero and closing call-to-action section.

## Approved Direction

The selected direction is option C from the visual comparison:

- Keep `Add to Chrome` as the filled primary pill button with its existing plus mark.
- Render the two alternative store actions as lightweight inline text links labeled
  `Edge` and `Firefox`.
- Use the same action hierarchy wherever `StoreActions` is rendered, so the hero and
  closing section stay visually consistent.

This preserves Chrome as the primary conversion action while reducing the horizontal
space occupied by alternatives.

## Scope

Change only the shared installation action component and the CSS needed for its
presentation. No store URLs, page structure, surrounding copy, or unrelated layout
rules change.

## Responsive Behavior

- At desktop and tablet widths, the primary pill and both secondary links sit on one
  inline row.
- At the existing phone breakpoint, `Add to Chrome` remains a full-width tap target.
  `Edge` and `Firefox` appear beneath it together as inline text links rather than
  as full-width secondary pills.
- The closing CTA uses the same visual treatment as the hero.

## Verification

- Component tests verify the primary link remains `Add to Chrome` and that the Edge
  and Firefox links still target their configured store destinations under their new
  visible labels.
- Visual verification checks both the hero and closing CTA at a desktop width and a
  phone width to ensure the actions do not regress into the reported two-row pill
  cluster.
