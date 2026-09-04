# Destiny Matrix — Change Log

Scope: `code.js`, `script\_person.js`, `inputs\_compatibility.js`, `index.css`, `index.html`, `compatibility.html`.
Goal: remove dead/duplicated code, fix a date-bounds bug, introduce CSS design tokens, consolidate the compatibility table into a single responsive layout, and rename auto-generated SVG classes to readable names — no visual or functional changes intended except the bug fix noted below.

\---

## 1\. Bug fix — wrong "oldest allowed" date

**Files:** `code.js` (new shared helper), previously in `script\_person.js` and `inputs\_compatibility.js`

```js
// before (in both files, duplicated)
const ancientDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDay());
```

`getDay()` returns the **weekday** (0–6), not the day-of-month — so the `min` date attribute on the birth-date inputs was off by a random 0–6 days depending on what day of the week "today" happens to be. This silently under- or over-restricted the oldest selectable birth date.

Fixed to `getDate()` (day-of-month), and centralized so it only exists once:

```js
// code.js — new
const MAX\_AGE\_YEARS = 120;

function setDateBounds(inputEl) {
  const today = new Date();
  const oldestAllowed = new Date(today.getFullYear() - MAX\_AGE\_YEARS, today.getMonth(), today.getDate());
  inputEl.setAttribute('max', today.toLocaleDateString('en-CA'));
  inputEl.setAttribute('min', oldestAllowed.toLocaleDateString('en-CA'));
}
```

`script\_person.js` and `inputs\_compatibility.js` now just call `setDateBounds(inputEl)` for each date input instead of repeating the logic.

\---

## 2\. Deduplication — redundant DOM lookups

**Files:** `script\_person.js`, `inputs\_compatibility.js`

Both click handlers were re-querying the same elements with `document.getElementById(...)` / `document.querySelector(...)` multiple times per call, when a module-level `const` already existed (or should have). Elements are now looked up once at load time and reused:

* `script\_person.js`: `errorOutput`, `outputDate` (was `.output-personal-date`) are now cached constants; the handler no longer re-fetches `#date` / `#name` redundantly.
* `inputs\_compatibility.js`: `wrongDateOutput` (was `.wrongDate`), `output2` are now cached constants; the handler no longer re-fetches `#date\_person1` / `#date\_person2` redundantly.

`validate()` and `validateDates()` now compute `today` fresh on each call (a local `const today = new Date()`) instead of relying on a stale module-level `today` captured at page load — this matters if the page is left open across a day boundary.

\---

## 3\. Deduplication — chakra circle CSS

**Files:** `index.css`, `index.html`

**Before:** 7 near-identical `#circle-<name>:before` rules in `index.css`, one per chakra, differing only in `content` (the number), `background`, `box-shadow` color, and occasionally `color`.

**After:** one shared rule:

```css
.chakra-circle:before {
  font-family: var(--font-heading);
  font-size: 1.375em;
  content: attr(data-chakra-number);
  width: 1.25em;
  border-radius: 50%;
  height: 1.25em;
  display: inline-flex;
  align-items: center;
  color: var(--chakra-text, var(--color-white));
  background: var(--chakra-color);
  justify-content: center;
  margin-right: 1.25em;
  box-shadow: 0 0 0.625em 0.625em var(--chakra-color);
}
```

Each chakra `<span>` in `index.html` now carries a `chakra-circle` class, a `data-chakra-number` attribute (replaces the hardcoded `content: "N"`), and sets `--chakra-color` (and `--chakra-text` where the original used black or off-white text) inline via `style="..."`. The old `id="circle-<name>"` attributes are removed — nothing in JS referenced them, so this is safe.

Example (Crown / Sahasrara):

```html
<span class="chakra-name-flex chakra-circle" data-chakra-number="7"
  style="--chakra-color: var(--chakra-sahasrara);">
  Sahasrara
</span>
```

\---

## 4\. CSS design tokens

**File:** `index.css`

Added a `:root` block collecting every color and font family used across the stylesheet, previously repeated as hardcoded hex values (some colors appeared 5–7 times each):

```css
:root {
  --color-bg: #050215;
  --color-gold: #fff8db;
  --color-white: #ffffff;
  --color-off-white: #f5f5f5;
  --color-off-white-2: #f9f9f8;
  --color-cream: #fffcf0;
  --color-black: #000000;
  --color-gray: #827d78;
  --color-gold-muted: #d2b154;

  --chakra-sahasrara: #b653f7;
  --chakra-ajna: #3d54f5;
  --chakra-vishuddha: #74e0f8;
  --chakra-anahata: #b6fd57;
  --chakra-manipura: #fbe49d;
  --chakra-svadhisthana: #ed7233;
  --chakra-muladhara: #ea4631;

  --font-heading: "GFS Didot";
  --font-body: "Inter";
}
```

Every hardcoded hex value elsewhere in `index.css` (\~30 occurrences) was replaced with the matching `var(--token-name)`. Colors are now defined in exactly one place; changing the palette means editing the `:root` block only.

\---

## 5\. Font tokens now point at the fonts the page actually loads

**File:** `index.css`

Previous session left `--font-heading` / `--font-body` mapped to the old `"GFS Didot"` / `"Inter"` names as a placeholder, flagged for a decision. Per your instruction to keep the fonts `index.html` loads (Cormorant Garamond + Nunito), the tokens are now:

```css
--font-heading: "Cormorant Garamond", serif;
--font-body: "Nunito", sans-serif;
```

with a generic fallback added to each so the browser has something sane if the Google Fonts request ever fails.

While in here, two more hardcoded color values that the earlier token pass missed (the CSS keyword `white`, not a hex code) were also converted to `var(--color-white)`: the chakra-table cell borders and the `.base-circle` border.

\---

## 6\. Compatibility table — merged into one responsive layout

**Files:** `compatibility.html`, `index.css`, `inputs\_compatibility.js`

**Before:** two nearly-identical `<table>` elements — `#table-compatibility` (desktop) and `#table-compatibility-adaptiv` (mobile) — with a CSS breakpoint that hid one and showed the other. Every id in the "Relationship / Union / Harmony" summary (`compatibilitySkypoint`, `compatibilityHarmony`, etc.) existed **twice** in the DOM, which is invalid HTML, only working because the JS used `querySelectorAll` instead of `getElementById`.

**After:** one `.compat-grid` — three `<div class="compat-column">` blocks (Relationship / Union / Harmony), each holding its title, description, a pair of value circles, the bracket SVG, and the result circle. Desktop and mobile are the *same* markup; only the CSS grid layout changes:

```css
.compat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-areas: "relationship union harmony";
}

@media screen and (max-width: 479px) {
  .compat-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "relationship union"
      "harmony harmony";
  }
}
```

This reproduces the exact same responsive behavior as before (Relationship + Union side by side, Harmony full-width below, on screens ≤479px) without a second copy of the markup. Each `compatibility\*` id now appears exactly once in the DOM — valid HTML, and one less thing to keep in sync if the content ever changes. `inputs\_compatibility.js`'s value-writing logic (`outputCompatibilityMatrixValues`) needed no changes; only its comment was updated to reflect that ids are no longer duplicated.

**Verification:** element counts (`<circle>`, `<line>`, `<polygon>`, `<rect>`) are identical to the original file; `<path>` count dropped from 14 → 8, which is expected — it's exactly the 6 duplicated bracket-icon paths (3 brackets × 2 paths, present twice for the two old tables) collapsing into one copy.

\---

## 7\. SVG class renaming

**Files:** `index.css`, `index.html`, `compatibility.html`

The `cls-3` … `cls-61` selectors were leftover auto-generated names from an SVG export tool, with no indication of what each one did. Every occurrence was renamed to describe its actual role, grouped by what the class controls — no rule *bodies* were changed, only the selector names, so there is no visual difference.

|Old|New|What it is|
|-|-|-|
|`cls-3`|`frame-square`|Outer square rectangles of the matrix frame|
|`cls-4`|`frame-octagon`|Octagon outline path|
|`cls-18`|`frame-dash-connector`|Dashed diagonal connector line|
|`cls-5` / `cls-6`|`genline-sahasrara` / `genline-sahasrara-arrow`|Violet generation-line diagonal + its arrowheads|
|`cls-7` / `cls-8`|`genline-muladhara` / `genline-muladhara-arrow`|Red generation-line diagonal + its arrowheads|
|`cls-44`|`genline-caption`|"male/female generation line" text labels|
|`cls-10` / `cls-13` / `cls-15` / `cls-19` / `cls-22` / `cls-25` / `cls-26`|`point-fill-sahasrara` / `-ajna` / `-vishuddha` / `-muladhara` / `-svadhisthana` / `-manipura` / `-anahata`|Point-circle fills, one per chakra accent color|
|`cls-24` / `cls-21` / `cls-23`|`point-fill-neutral-big` / `-small` / `-medium`|Cream-fill point circles, by size|
|`cls-53`|`icon-heart`|The heart icon path near the center of the chart|
|`cls-54` / `cls-55`|`point-text-big-light` / `point-text-big-dark`|Value text on big circles (light text on dark bg / dark text on light bg)|
|`cls-57` / `cls-58`|`point-text-small-light` / `point-text-small-dark`|Same pairing, small circles|
|`cls-59` / `cls-60`|`point-text-medium-light` / `point-text-medium-dark`|Same pairing, medium circles|
|`cls-56`|`icon-dollar-text`|The "$" glyph near the money icon|
|`cls-28` / `cls-29`|`age-band-label` / `age-band-label-minor`|"0/10/20…70 years old" ring labels and their in-between "5/15/25…" variants|
|`cls-43`|`age-band-label-minor-sub`|The tiny "years"/"old" sub-labels inside the minor age labels|
|`cls-33`|`year-tick-value`|The small rotated numbers along each age-ray (e.g. `af2point`)|
|`cls-61`|`year-fraction-label`|The small age-range fraction labels (e.g. "11-12,5")|

Also removed: a stray `clss` class on the `epoint` / `compatibilityEpoint` text elements (a typo left over from editing — it had no matching CSS rule anywhere, so it did nothing).

**Verification:** ran a token-substitution pass (not a rewrite) so every rule's declarations are byte-identical to before, just renamed; brace count in `index.css` balances before/after, and `<text>/<circle>/<rect>/<line>/<polygon>/<path>` element counts in both HTML files match the originals exactly (aside from the expected compatibility-table path reduction above).

\---

## Everything from this pass — complete list of files touched

`code.js`, `script\_person.js`, `inputs\_compatibility.js`, `index.css`, `index.html`, `compatibility.html`

No remaining flagged issues from the original review. If anything else looks off, flag it and I'll take a pass at it.

## Critical Issue:

&#x20;Compatibility matrix calc doesn't calculate correctly from the main code downloaded from github. It's not a new issue, but must be fixed.

