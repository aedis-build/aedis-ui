# Migrating from Radix to Base UI

Aedis UI primitives now build on [Base UI](https://base-ui.com) (`@base-ui/react`, one package, exact version) instead of
twelve `@radix-ui/*` packages. Markup, styles and security behaviour are the same. What changed for callers:

## Composition: `asChild` → `render`

```tsx
// Before
<DialogTrigger asChild>
  <Button variant="outline">Invite</Button>
</DialogTrigger>

// After
<DialogTrigger render={<Button variant="outline" />}>Invite</DialogTrigger>
```

`Button` takes `render` too. It keeps the role of what it renders, so a link stays a link:

```tsx
<Button render={<a href="/docs" />}>Docs</Button>
```

## Changed props

| Component | Before (Radix) | After (Base UI) |
|---|---|---|
| Every trigger, `Button` | `asChild` | `render={<Element />}` |
| `AlertDialogContent`, `DialogContent` | `onOpenAutoFocus` | `initialFocus` (Alert Dialog still starts on Cancel) |
| `AlertDialogContent`, `DialogContent` | `onCloseAutoFocus` | `finalFocus` |
| `AlertDialog`, `Dialog` | `onOpenChange(open)` | `onOpenChange(open, eventDetails)` |
| `TooltipProvider` | `delayDuration` | `delay` |
| `Checkbox`, `Switch` | `onCheckedChange(checked)` | `onCheckedChange(checked, eventDetails)` |
| `RadioGroup`, `Tabs` | `onValueChange(value)` | `onValueChange(value, eventDetails)` |
| `Label` | Radix `Label.Root` | native `<label>` |
| `className` | string | string (Base UI's state function is not exposed, so `cn` can merge it) |

## Styling hooks

State attributes follow Base UI. If you added classes on top of Aedis components:

| Before | After |
|---|---|
| `data-[state=checked]` / `data-[state=unchecked]` | `data-checked` / `data-unchecked` |
| `data-[state=active]` (tabs) | `data-active` |
| `data-[state=open]` / `data-[state=closed]` | `data-open` / `data-closed` |
| `data-[disabled]` | `data-disabled` |
| enter/exit `animate-in` / `animate-out` | `data-starting-style` / `data-ending-style` with a CSS transition |

Enter and exit motion still animates only `opacity` and `transform` (`scale`, `translate`) and is off under
`prefers-reduced-motion`.
