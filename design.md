# Voice Preview Prototype — Design System Reference

> Portable design token & component reference extracted from the voice-preview-prototype project
> (vanilla HTML/CSS/JS, 496 x 900 px panel) and the Trengo DS Foundations Figma file.

---

## 1. Color Palette

### 1.1 Grey Scale

| Token      | Hex       | Usage                                                       |
|------------|-----------|-------------------------------------------------------------|
| Grey-900   | `#111213` | Primary text, dark buttons, tooltip backgrounds             |
| Grey-800   | `#292C2E` | Secondary headings, note body text, hover-state dark btn    |
| Grey-700   | `#4D5256` | Icon default color, dropdown item text, badge text          |
| Grey-600   | `#70767B` | Muted/secondary text, timestamps, placeholders, input hint  |
| Grey-400   | `#C6C9CD` | Scrollbar thumb, border on toolbar-mic, event badge border  |
| Grey-300   | `#E1E3E5` | Primary borders (cards, inputs, dividers, modal outline)    |
| Grey-200   | `#F4F5F6` | Hover backgrounds, reminder icons bg, summary card bg       |
| Grey-100   | `#F9FAFB` | Panel outer background, expanded resource card bg           |
| White      | `#FFFFFF` | Card backgrounds, modal background, button defaults         |

### 1.2 Semantic / Accent Colors (used in prototype)

| Token        | Hex       | Usage                                           |
|--------------|-----------|--------------------------------------------------|
| Error/500    | `#E8374C` | End-call button, muted mic button background     |
| Sun/200      | `#FFEDBE` | Note card background (yellow)                    |
| Purple/200   | `#F3DDFF` | Badge icon circle variant (purple actions)        |

### 1.3 Extended Palettes (Figma DS Foundations)

#### Leaf (green/teal)

| Step | Hex       |
|------|-----------|
| 100  | `#E3F6F3` |
| 200  | `#ADE5DC` |
| 300  | `#76CCBE` |
| 400  | `#49B2A1` |
| 500  | `#249888` |
| 600  | `#177B6B` |
| 700  | `#0C5D51` |
| 800  | `#054037` |
| 900  | `#01221D` |

> Focus ring color is Leaf-500 (`#249888`).

#### Sky (blue)

| Step | Hex       |
|------|-----------|
| 100  | `#F4FCFF` |
| 200  | `#D7F3FF` |
| 300  | `#BBEAFF` |
| 400  | `#9EE0FF` |
| 500  | `#81D7FF` |
| 600  | `#4FA1C8` |
| 700  | `#286F90` |
| 800  | `#0F4159` |
| 900  | `#021721` |

#### Purple

| Step | Hex       |
|------|-----------|
| 100  | `#FBF4FF` |
| 200  | `#F3DDFF` |
| 300  | `#EAC6FF` |
| 400  | `#E1B0FF` |
| 500  | `#D999FF` |
| 600  | `#A965D3` |
| 700  | `#7E3CA7` |
| 800  | `#571D7C` |
| 900  | `#350950` |

#### Peach (orange)

| Step | Hex       |
|------|-----------|
| 100  | `#FFEBE6` |
| 200  | `#FFD0C5` |
| 300  | `#FFB6A3` |
| 400  | `#FE9B82` |
| 500  | `#FE8161` |
| 600  | `#DF694C` |
| 700  | `#BE5439` |
| 800  | `#9E4129` |
| 900  | `#7D2F1C` |

#### Sun (yellow)

| Step | Hex       |
|------|-----------|
| 50   | `#FFFBF0` |
| 100  | `#FFF5DB` |
| 200  | `#FFEDBE` |
| 300  | `#FFE4A1` |
| 400  | `#FFDC84` |
| 500  | `#FFD467` |
| 600  | `#F1B749` |
| 700  | `#E2992E` |
| 800  | `#D47B15` |
| 900  | `#C55E00` |

---

## 2. Typography

### 2.1 Font Stack

```
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

Loaded weights: **400** (Regular), **500** (Medium), **600** (Semi Bold), **700** (Bold).

### 2.2 Type Scale

| Size  | Weight | Line-height | Usage                                                  |
|-------|--------|-------------|--------------------------------------------------------|
| 12px  | 500    | 16px        | Tooltips, badge labels, badge timestamps, section titles |
| 14px  | 500    | 20px        | Body text, reminders, dropdown items, input text, timer |
| 14px  | 600    | 20px        | Buttons, channel button, summary header, toolbar status |
| 16px  | 600    | 24px        | Voice status, placeholder title                        |
| 18px  | 700    | 24px        | Preview title (header)                                 |

### 2.3 Special Typographic Features

| Feature                | CSS                                                   | Where used            |
|------------------------|-------------------------------------------------------|-----------------------|
| Tabular numbers        | `font-variant-numeric: tabular-nums`                  | All timers & durations |
| Timer letter-spacing   | `letter-spacing: 0.02em`                              | Timer displays         |
| Section title caps     | `text-transform: uppercase; letter-spacing: 0.48px`   | Audio device sections  |

---

## 3. Spacing & Sizing

### 3.1 Padding Scale

| Value | Usage examples                                            |
|-------|-----------------------------------------------------------|
| 4px   | Badge icon circle inner padding, note scenario padding    |
| 6px   | Icon buttons, preview icon wrap, toolbar mic              |
| 8px   | Panel inner padding, gaps, reminder inner, audio sections |
| 10px  | Input padding (vertical), badge pill padding, reminder items |
| 12px  | Reminder container, chat input area, summary card padding |
| 14px  | Input padding (horizontal)                                |
| 16px  | Note card padding, summary card padding, chat input area  |
| 20px  | Header padding, voice scroll horizontal padding, bottom bar |
| 24px  | Chat placeholder padding, bottom bar gradient bottom       |
| 40px  | Chat placeholder top padding                               |

### 3.2 Gap Scale

| Value | Usage                                                  |
|-------|--------------------------------------------------------|
| 3px   | Mic level bars                                         |
| 4px   | Button icon+text, channel button, dropdown menu items  |
| 8px   | Header left items, header right items, reminder items, toolbar items |
| 10px  | Dropdown item icon+text, placeholder bubbles           |
| 12px  | Reminder list spacing, used resources body, summary card inner |
| 20px  | Voice hero sections, events timeline items             |

### 3.3 Fixed Dimensions

| Element            | Width  | Height | Notes                         |
|--------------------|--------|--------|-------------------------------|
| Preview panel      | 496px  | 900px  | min-height & max-height       |
| Modal inner        | 480px  | —      | 496 − 2 × 8px padding        |
| Circular button    | 32px   | 32px   | Send, mic toggle              |
| Dropdown (popover) | 256px  | auto   | Fixed width                   |
| Icon sizes         | 16/20/24px | —  | Three standard icon sizes     |

---

## 4. Border Radius Scale

| Token    | Value  | Typical usage                                     |
|----------|--------|----------------------------------------------------|
| xs       | 4px    | Scrollbar thumbs, tiny indicators                  |
| sm       | 6px    | Tooltips, small icon containers                    |
| base     | 8px    | Buttons, list items, form controls                 |
| md       | 10px   | Inputs, tags                                       |
| lg       | 12px   | Cards, panels, modals, dropdown menus              |
| xl       | 14px   | Badge circles, icon wrappers                       |
| 2xl      | 16px   | Content cards, expanded panels                     |
| pill     | 24px   | Pill buttons, toolbars, toggle controls            |
| full     | 100px  | Fully-rounded badges, status pills                 |
| circle   | 50%    | Circular buttons, avatars                          |

---

## 5. Shadows & Elevation

### 5.1 Shadow Tokens (from Figma DS Foundations)

| Token          | CSS Value                                                                      | Usage                                     |
|----------------|--------------------------------------------------------------------------------|--------------------------------------------|
| shadow-100     | `0 1px 4px 0 rgba(0,0,0,0.06)`                                                | Buttons, selects, toggles, small UI        |
| shadow-300     | `0 2px 4px -1px rgba(0,0,0,0.08), 0 8px 16px -2px rgba(0,0,0,0.02)`          | Hovering cards, toolbar, dropdown menus    |
| shadow-500     | `0 4px 8px -4px rgba(0,0,0,0.16), 0 12px 24px -2px rgba(0,0,0,0.03)`         | Popovers, audio dropdown, elevated cards   |
| shadow-inner   | `inset 0 0 0 1px rgba(0,0,0,0.1)`                                             | Colored surfaces, image thumbnails          |

### 5.2 Focus States

| Token              | CSS Value                                                                          | Usage                                     |
|--------------------|------------------------------------------------------------------------------------|--------------------------------------------|
| focus-default      | `0 0 0 4px rgba(36,152,136,0.25)`, inner `0 0 0 1px #249888`                      | Standard focus ring (inputs, buttons)      |
| focus-default-error| `0 0 0 4px #FAD7DB`, inner `0 0 0 1px #E8374C`                                    | Error-state focus ring                     |
| focus-small        | `0 0 0 2px rgba(36,152,136,0.25)`, inner `0 0 0 2px #249888`                      | Checkboxes, radio buttons, tiny controls   |

### 5.3 Backdrop Blur

```css
backdrop-filter: blur(12px);
background: rgba(255,255,255,0.7);
```

Used on the sticky header for a frosted-glass effect.

### 5.4 Gradient Overlay

```css
background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 25%);
```

Used on bottom-bar-gradient to fade content into the toolbar area.

> **Rule**: All shadow tokens (except shadow-inner) are combined with a Grey-300 (`#E1E3E5`) or Grey-400 (`#C6C9CD`) `1px solid` inner border.

---

## 6. Transitions & Animation

### 6.1 Standard Transitions

| Property      | Duration | Easing  | Usage                                     |
|---------------|----------|---------|-------------------------------------------|
| background    | 0.15s    | default | Icon buttons, dropdown items, mic bar color |
| all           | 0.15s    | default | Buttons, resource tags, toolbar mic        |
| opacity       | 0.15s    | default | Tooltip fade in/out                        |
| max-height    | 0.3s     | ease    | Summary body collapse                      |
| opacity       | 0.2s     | ease    | Summary body collapse fade                 |
| transform     | 0.2s     | default | Collapse button rotation (180deg)          |

---

## 7. Component Inventory

### 7.1 Preview Panel (root container)

```
.preview-panel  →  496px wide, 900px fixed height
  └─ .modal-inner  →  white bg, 1px Grey-300 border, 12px radius, flex column
```

### 7.2 Header

- **Layout**: Flex row, `justify-content: space-between`, padding 20px
- **Background**: Frosted glass — `rgba(255,255,255,0.7)` + `backdrop-filter: blur(12px)`
- **Sticky**: `flex-shrink: 0`, `z-index: 10`
- **Left side**: Icon thumbnail (8px radius box with 1px 10% black border) + title (18px bold)
- **Right side**: Channel dropdown + refresh button + more button

### 7.3 Channel Dropdown

- **Trigger**: `.channel-btn` — 14px semi-bold, Grey-700, hover bg Grey-200
- **Menu**: `.dropdown-menu` — white bg, 1px Grey-300 border, 12px radius, shadow-300, 4px padding
- **Items**: `.dropdown-item` — 14px medium, Grey-800, 8px radius, 10px 12px padding, 10px gap
- **Active indicator**: Green circle check (fill `#10B981`) shown via `.active` class

### 7.4 Icon Button

```css
padding: 6px; border: none; background: transparent; border-radius: 8px;
color: #4D5256; /* Grey-700 */
```
- Hover: bg Grey-200
- Variant `.icon-btn-more`: white bg, 12px radius

### 7.5 Buttons

| Variant    | Background  | Text     | Hover bg    | Extra                      |
|------------|-------------|----------|-------------|----------------------------|
| `.btn-dark`| `#111213`   | white    | `#292C2E`   | —                          |
| `.btn-end` | `#E8374C`   | white    | `#d42f42`   | —                          |

**Shared**: `padding: 6px 12px`, `border-radius: 24px`, `font-size: 14px`, `font-weight: 600`, `gap: 4px`, inline-flex, 20px icon.

### 7.6 Bottom Toolbar

- **Gradient overlay**: Fades white from 0% → 25%, `border-radius: 24px 24px 0 0`
- **Toolbar pill**: Inline-flex, 8px gap, white bg, 1px Grey-300 border, 24px radius, 8px padding, shadow-300
- **Mic level indicator**: 32px wrap, 4 bars (3px wide, 4–16px animated height), Grey-600 color
- **Status**: 14px semi-bold, label in Grey-900, time in Grey-600 tabular-nums
- **Divider**: 1px wide Grey-300 line, vertical
- **Mute toggle**: 24px pill, 1px Grey-400 border, 6px padding; muted = Error/500 bg + white icon
- **Ended state**: Red mic icon (Error/500 bg, no border)

### 7.7 Audio Devices Dropdown

- **Position**: Absolute, above mic indicator (bottom: calc(100% + 8px))
- **Size**: 256px wide, shadow-500, 12px radius, 8px vertical padding
- **Section title**: 12px medium Grey-600, uppercase, 0.48px letter-spacing
- **Device item**: 8px padding, 8px radius, 14px medium Grey-700, hover bg Grey-200

### 7.8 Events Timeline

- **Layout**: Centered column, 20px gap, bottom-aligned (`margin-top: auto`)
- **Badge container**: Each event rendered as `.event-badge` or a card

### 7.9 Event Badge (pill)

```css
background: #fff; border: 1px solid #C6C9CD; border-radius: 100px;
padding: 4px 10px 4px 4px; font-size: 12px; font-weight: 600; color: #4D5256;
```
- **Icon circle**: Grey-200 bg, 14px radius, 4px padding, 16px icon
- **Icon variants**: `.purple` → Purple/200 bg; `.dark` → Grey-900 bg + white icon
- **Caret**: 20px SVG in Grey-600 (for expandable badges)
- **Time**: Grey-600, tabular-nums

### 7.10 Note Card

- **Background**: Sun/200 (`#FFEDBE`)
- **Radius**: `16px 16px 16px 4px` (chat-bubble shape)
- **Padding**: 8px 16px
- **Body**: 14px medium Grey-800, 24px line-height
- **Footer**: Flex between — scenario count (Grey-600 + caret) and meta (time + comment icon)

### 7.11 Call Summary Card

- **Background**: Grey-200 (`#F4F5F6`)
- **Radius**: `16px 16px 16px 4px`
- **Padding**: 12px 16px, 8px inner gap
- **Header**: Sparkle icon + "Call summary" (14px semi-bold), duration (14px medium Grey-600), collapse button
- **Body**: 14px medium Grey-800, 24px line-height, collapsible (max-height animation)
- **Spacer**: 24px empty div between paragraphs

### 7.12 Used Resources (expandable)

**Collapsed state** — standard event badge with caret, hover lifts with shadow-100
**Expanded state**:
- Grey-100 bg, 1px Grey-400 border, 16px radius, 12px padding
- Header: File icon + title (12px semi-bold Grey-700) + time + caret-up
- Resource tags: white bg, 1px Grey-300 border, 10px radius, 4px 12px 4px 8px padding, hover Grey-200

### 7.13 Tooltip

```css
background: #111213; color: #fff; font-size: 12px; font-weight: 500;
padding: 4px 8px; border-radius: 6px; /* pseudo-element, fade on hover */
```

---

## 8. Icons & Illustrations

### 8.1 Icon Defaults

All icons are outline-style SVGs: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`. Render sizes: **16px**, **20px**, **32px**.

Naming convention in Figma: `Icon / {Name} - outline` (e.g. `Icon / Phone - outline`, `Icon / Chevron - Down - outline`).

### 8.2 How to Fetch Icons

When generating code that needs an icon, **pull SVG data from Figma at build time** rather than hardcoding markup.

**Figma source:**
- **File**: `6F8rU64QxDONx5YaQrxA0J` (Trengo Design System)
- **Icons frame**: node `2342:64352`
- **Illustrations frame**: node `5334:54251`

**Workflow for Claude / code generation:**
1. Use `search_design_system` with the icon name (e.g. query `"Phone"`, `"Chevron Down"`) to find the component key.
2. Use `get_design_context` on the matched node to get the SVG code.
3. Clean the SVG output and embed it inline or save to `src/assets/icons/{Name}.vue`.

**Example prompt pattern:**
> "I need a Phone icon" → search Figma for `Icon / Phone - outline` → extract SVG → render at 20px with `stroke="currentColor"`.

### 8.3 Available Icon Categories

The library contains **500+ icons** across these groups:

| Category             | Examples                                                        |
|----------------------|-----------------------------------------------------------------|
| Navigation           | Arrow, Chevron, Check, Cross, Plus, Minus, Menu, Search, Sort   |
| Communication        | Comment, Email, Send, Reply, Forward, Paperclip, Bell, Broadcast|
| Phone & Voice        | Phone, Call (Incoming/Outgoing/Missed/End/Redirect/Hold), Mic, Volume, Dialpad |
| Users                | User, User-Plus/Minus/Check/Cross, Users (group)               |
| Files & Content      | File, Folder, Clipboard, Copy, Note, Book, Image, Trash        |
| Status & Feedback    | Info, Alert-Triangle, Question, Star, Heart, Thumbs, Emotions, Flag, Bug |
| AI & Automation      | AI Conversation, AI HelpMate, AI Inbox, AI routing, chatbot, Lightning |
| Layout & Editing     | Edit, Eye, Lock, Gear, Layers, Maximize, Undo/Redo, Link, Code |
| Commerce & Data      | Tag, Ticket, Credit Card, Wallet, Cart, Dollar/Euro, Charts, Calendar, Clock |
| Sidebar              | `icon-sidebar-{name}` + `-filled` pairs: inbox, settings, contacts, boards, reports, voice, broadcast, notification, support, helpcenter, ai |

### 8.4 Illustrations

Illustrations are complex vector/raster assets — fetch from Figma on demand using `get_design_context` or `get_screenshot` on node `5334:54251`.

| Category                     | Usage                                       |
|------------------------------|---------------------------------------------|
| Channel Icons                | Per-channel brand icons (chat, email, voice, WhatsApp, social) |
| E-mail visuals               | Email campaign and flow illustrations        |
| WhatsApp / WAB Broadcasting  | WhatsApp-specific UI and broadcast flows     |
| Value proposition slides     | Feature/benefit marketing visuals            |
| Onboarding (Appcues)         | Product tours and introduction screens       |
| Product illustrations        | Empty states, feature explanations, dashboards |

---

## 9. Layout System

### 9.1 Panel Structure

```
body (Grey-200 bg, centered, 32px padding)
  └─ .preview-panel (496 x 900px, Grey-100 bg, 8px padding, 12px radius)
       └─ .modal-inner (white bg, 1px Grey-300 border, 12px radius, flex-col, overflow hidden)
            ├─ .preview-header (sticky via flex-shrink:0, z-index:10, frosted glass)
            ├─ .preview-content (flex:1, flex-col, overflow hidden)
            │    ├─ [scrollable area] (flex:1, overflow-y auto)
            │    ├─ [reminders / input] (flex-shrink:0)
            │    └─ [bottom toolbar] (flex-shrink:0, sticky bottom)
```

### 9.2 Scroll Behavior

- **Voice view**: `.voice-scroll` has `overflow-y: auto` with custom scrollbar (4px wide, Grey-400 thumb, transparent track)
- **Chat view**: No scroll in prototype (placeholder fills space)

### 9.3 Sticky Patterns

| Element        | Mechanism                                 | Z-index |
|----------------|-------------------------------------------|---------|
| Header         | `flex-shrink: 0` at top of flex column    | 10      |
| Bottom toolbar | `flex-shrink: 0` at bottom of flex column | —       |
| Dropdown menu  | `position: absolute`, `z-index: 100`     | 100     |
| Audio dropdown | `position: absolute`, `z-index: 200`     | 200     |

### 9.4 Responsive Notes

This prototype is fixed-width (496px) and not responsive. For adaptation:
- Panel width could flex between 400–560px
- Typography scale remains fixed (no fluid type)
- All spacing is pixel-based (convert to rem at 1rem = 16px if needed)

---

## 10. Interaction States

| Component         | Default                    | Hover                         | Active/Open                |
|-------------------|----------------------------|-------------------------------|----------------------------|
| Icon button       | Transparent bg             | Grey-200 bg                   | —                          |
| Channel button    | Transparent bg             | Grey-200 bg                   | Dropdown shown             |
| Dropdown item     | Transparent bg             | Grey-200 bg                   | Green check visible        |
| Toolbar mic       | White bg, Grey-400 border  | Grey-200 bg                   | Error/500 bg (muted)       |
| Mic level wrap    | Transparent bg             | Grey-100 bg, tooltip visible  | Grey-300 bg (dropdown open)|
| Used resources    | Badge (collapsed)          | Grey-200 bg + shadow-100      | Expanded card              |
| Resource tag      | White bg, Grey-300 border  | Grey-200 bg, Grey-400 border  | —                          |
| Summary collapse  | Caret up                   | —                             | Rotated 180deg (caret down)|

---

## 11. Tailwind Config Mapping (suggested)

For bootstrapping a Tailwind-based project from these tokens:

```js
// tailwind.config.js (excerpt)
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        grey: {
          900: '#111213',
          800: '#292C2E',
          700: '#4D5256',
          600: '#70767B',
          400: '#C6C9CD',
          300: '#E1E3E5',
          200: '#F4F5F6',
          100: '#F9FAFB',
        },
        leaf: {
          100: '#E3F6F3', 200: '#ADE5DC', 300: '#76CCBE',
          400: '#49B2A1', 500: '#249888', 600: '#177B6B',
          700: '#0C5D51', 800: '#054037', 900: '#01221D',
        },
        sky: {
          100: '#F4FCFF', 200: '#D7F3FF', 300: '#BBEAFF',
          400: '#9EE0FF', 500: '#81D7FF', 600: '#4FA1C8',
          700: '#286F90', 800: '#0F4159', 900: '#021721',
        },
        purple: {
          100: '#FBF4FF', 200: '#F3DDFF', 300: '#EAC6FF',
          400: '#E1B0FF', 500: '#D999FF', 600: '#A965D3',
          700: '#7E3CA7', 800: '#571D7C', 900: '#350950',
        },
        peach: {
          100: '#FFEBE6', 200: '#FFD0C5', 300: '#FFB6A3',
          400: '#FE9B82', 500: '#FE8161', 600: '#DF694C',
          700: '#BE5439', 800: '#9E4129', 900: '#7D2F1C',
        },
        sun: {
          50: '#FFFBF0', 100: '#FFF5DB', 200: '#FFEDBE',
          300: '#FFE4A1', 400: '#FFDC84', 500: '#FFD467',
          600: '#F1B749', 700: '#E2992E', 800: '#D47B15',
          900: '#C55E00',
        },
        error: { 500: '#E8374C' },
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '14px',
        '2xl': '16px',
        pill: '24px',
        full: '100px',
      },
      boxShadow: {
        100: '0 1px 4px 0 rgba(0,0,0,0.06)',
        300: '0 2px 4px -1px rgba(0,0,0,0.08), 0 8px 16px -2px rgba(0,0,0,0.02)',
        500: '0 4px 8px -4px rgba(0,0,0,0.16), 0 12px 24px -2px rgba(0,0,0,0.03)',
        inner: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
        'focus-default': '0 0 0 4px rgba(36,152,136,0.25)',
        'focus-error': '0 0 0 4px #FAD7DB',
        'focus-small': '0 0 0 2px rgba(36,152,136,0.25)',
      },
    },
  },
};
```
