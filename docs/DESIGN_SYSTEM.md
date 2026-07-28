# Retro Pixel Design System

This document describes the visual system implemented by the frontend. It is a
reference for contributors and for keeping new UI consistent with the existing
application.

## Principles

- Use square corners, hard borders and offset shadows to preserve the arcade
  visual language.
- Use color to communicate purpose: mustard for primary actions, teal for
  secondary information and red for destructive actions or losses.
- Keep gameplay information compact and readable at narrow and wide viewport
  sizes.
- Reuse the components below before adding page-specific markup.

## Color Palette

The canonical tokens live in
[`frontend/styles/globals.css`](../frontend/styles/globals.css). Tailwind maps
the same tokens in
[`frontend/tailwind.config.js`](../frontend/tailwind.config.js).

| Role | Token | Value | Usage |
|---|---|---:|---|
| Primary | `--primary` | `#d5a62b` | Main actions, focus and progress |
| Primary light | `--primary-container` | `#e7bf49` | Active and highlighted surfaces |
| Secondary | `--secondary` | `#3ca6a0` | Supporting actions and information |
| Tertiary | `--tertiary` | `#d75b46` | Busy state and strong accents |
| Error | `--error` | `#ef765f` | Errors, destructive actions and losses |
| Background | `--surface` | `#211e1b` | Application background |
| Panel | `--surface-container` | `#302a27` | Default panel surface |
| Raised panel | `--surface-container-high` | `#3a322c` | Menus and elevated controls |
| Primary text | `--on-surface` | `#f4e7c5` | Main text on dark surfaces |
| Muted text | `--on-surface-variant` | `#c0af91` | Secondary labels and metadata |
| Border | `--outline` | `#8a7966` | Neutral outlines and separators |

Components must consume semantic tokens rather than introduce a new color for
the same role. Page-specific colors are acceptable only when they represent
game state, such as black and white Reversi pieces.

## Typography

- The product typeface is `Courier New`, with `ui-monospace` and
  `monospace` fallbacks.
- Headings use bold weight and may use pixel shadows for hierarchy.
- Labels use the established underscore convention, for example
  `MATCHES_PLAYED`.
- Turn messages use natural lowercase text because they are live sentences,
  not interface labels.
- Letter spacing remains zero in the retro layer to preserve readability.

## Iconography

The interface uses compact pixel-style visual symbols instead of decorative
illustrations:

- the default avatar is a CSS-drawn pixel face;
- loaders use a four-block animated track;
- status and notification markers use token-based square or circular marks;
- Reversi pieces identify player color and turn state;
- directional review and disclosure controls use familiar previous, next and
  caret symbols with accessible text or labels.

Icons must inherit semantic colors, remain legible at their fixed dimensions
and include an accessible name when they are the only content of a control.

## Reusable Components

The system currently provides more than the required ten reusable React
components. Layout components may contain application behavior, but their
public props keep page code independent from their internal presentation.

| Component | Location | Reusable responsibility |
|---|---|---|
| `Avatar` | `components/ui/Avatar.tsx` | Remote, uploaded and default avatars with consistent retro treatment |
| `PixelLoader` | `components/ui/PixelLoader.tsx` | Accessible loading state with an optional label |
| `StackLayout` | `components/ui/StackLayout.tsx` | Fixed notification stack for transient prompts |
| `MsgBox` | `components/layout/MsgBox.tsx` | Global informational and error toast |
| `Sidebar` | `components/layout/Sidebar.tsx` | Primary authenticated navigation |
| `TopBar` | `components/layout/TopBar.tsx` | Friends, unread state, current match, profile and logout controls |
| `CurrentGame` | `components/layout/CurrentGame.tsx` | Live or completed match status and return action |
| `ChatWindow` | `components/layout/ChatWindow.tsx` | Reusable private-chat window with unread and presence states |
| `DuelPrompt` | `components/layout/DuelPrompt.tsx` | Incoming configurable duel prompt |
| `Achievements` | `components/layout/Achievements.tsx` | Achievement grid and progress visualization for any public user |
| `MatchHistory` | `components/layout/MatchHistory.tsx` | Paginated own or public match history |
| `MatchEntry` | `components/layout/MatchEntry.tsx` | Expandable match summary and review action |

## Shared CSS Patterns

[`frontend/styles/components.css`](../frontend/styles/components.css) contains
the shared visual patterns consumed by components and pages. Classes such as
`btn-primary`, `btn-secondary`, `btn-ghost`, `pixel-toast` and
`profile-stat-card` are styling primitives, not additional React components.

New variants should extend an existing semantic pattern when they share the
same behavior. A new React component is warranted when markup, accessibility
or interaction is repeated, not merely to increase the component count.

## Interaction And Accessibility

- Loading components expose `role="status"` and live regions.
- Error messages use `role="alert"`.
- Expandable controls expose `aria-expanded`.
- Images and avatar fallbacks have meaningful alternative labels.
- Disabled controls remain visibly distinct and cannot trigger actions.
- Keyboard focus and hover states use the same semantic color roles.

## Adding A Component

1. Confirm that the behavior or markup is reused or forms a stable application
   boundary.
2. Put generic visual primitives in `components/ui` and application-wide
   composed components in `components/layout`.
3. Define a typed props interface and avoid reading page-specific state when it
   can be passed explicitly.
4. Reuse palette and typography tokens.
5. Include loading, empty, disabled and error states where applicable.
6. Verify production build and responsive behavior before integration.
