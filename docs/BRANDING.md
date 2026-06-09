# Branding

## Wordmark

The NextFlight wordmark is **always typed text**, never an image. The component
`components/Wordmark.tsx` renders it with Playfair Display Italic (Cronde fallback),
gold ink on burgundy, kerning slightly tightened.

Do not replace the wordmark with a logo asset, do not add a roundel or badge, do
not lock it inside a circle. Typography is the brand.

## Color system

Defined in `theme/tokens.ts`.

| Token                | Hex        | Usage                                          |
| -------------------- | ---------- | ---------------------------------------------- |
| `burgundy.900`       | deep       | Primary background                             |
| `burgundy.800/700`   | mids       | Card surfaces, borders                         |
| `gold.400`           | `#A78352`  | Primary accent, primary CTA, eyebrow type      |
| `gold.600`           | darker     | Borders on light surfaces                      |
| `cream.100`          | `#FFFBE0`  | Primary text on dark, hero card surfaces       |
| `cream.200`          | softer     | Secondary text, muted copy                     |
| `ink.500/700`        | greys      | Text on cream surfaces                         |
| `state.success`      | green      | Confirmations, KYC approved                    |
| `state.warning`      | amber      | Warnings, KYC pending                          |
| `state.error`        | wine red   | Errors, rejections                             |

Never introduce purple, indigo, or violet tones. Avoid pure black; always reach for
burgundy.

## Typography

- **Heading italic** — Playfair Display Italic (`fonts.headingItalic`). Hero phrases,
  metaphor moments ("Tu cabina", "La Aduana").
- **Heading bold** — Playfair Display Bold (`fonts.headingBold`). Numbers,
  display prices.
- **Body** — Poppins Regular/Medium/Semibold (`fonts.body`, `bodyMedium`,
  `bodySemibold`).
- **Support** — Inter (Glancyr fallback) for eyebrow caps, labels, metadata.

Use 3 weights max per surface. Body line-height 150%, headings 120%.

## Iconography

Lucide only. Stroke 1.4–1.8 for ambient icons, 2 for filled-state icons. Match icon
color to surrounding text. Never inline an SVG outside Lucide unless authored
specifically for the brand.

## Spacing

Always 8px-grid (`spacing.xs` 4 → `spacing.xxxl` 64). Do not invent off-grid values.

## Visual cliches to avoid

- Generic "premium" purple gradients.
- Holographic or chrome treatments.
- Hand-drawn illustrations that aren't aviation-themed.
- Plane silhouettes with motion lines (it's tacky).

## Aviation language (visual)

- Burgundy + gold = first-class cabin.
- Cream is the boarding pass.
- Eyebrow caps are gate signs.
- Cards have hairline gold borders like ticket edges.
