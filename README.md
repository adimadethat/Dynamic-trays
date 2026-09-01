# Dynamic Trays (React Native, zero animation libraries)

Family-style **dynamic trays** — a bottom sheet that **morphs its height to fit
each step** and **cross-fades its content** — built from scratch with **only
React Native core**. No Reanimated, no Gesture Handler, no Moti, no Skia.

The only runtime dependencies are `react` and `react-native`. Look at
`package.json` — there is no animation library in it.

Two reference behaviors from the Family app are reproduced:

| Flow | File | Transition | What it shows |
|------|------|-----------|---------------|
| **Refuel Gas** | `src/flows/RefuelFlow.tsx` | `push` | A forward flow: Choose Chains → Choose Amount → Custom Amount (keypad) → Review → Confirm. The tray height springs at every step. |
| **Wallet Options** | `src/flows/OptionsFlow.tsx` | `fade` | An info reveal: Options → Private Key / Recovery Phrase → back. Symmetric cross-dissolve. |

---

## The one thing everybody gets wrong

> "Height can't be animated." / "The tray has live components inside, so it
> stutters."

Both are half-true, and the half that's true is fixable:

1. **Height genuinely cannot use the native driver.** The native driver only
   accepts `opacity` and `transform`. Layout props like `height` animate on the
   **JS thread**. That is not the same as "can't be animated" — `Animated.spring`
   drives `height` perfectly well on the JS thread.

2. **The stutter is not caused by animating height.** It's caused by animating
   height **while the children re-render and re-measure every frame.** If a tray
   holds live components with their own state, and you animate the container
   height, every single frame pays for a React re-render **and** a full Yoga
   relayout of those live components. That's the jank.

### How this project avoids it

`src/tray/DynamicTray.tsx` does three things:

1. **Measure once.** Every step reports its natural height through `onLayout`
   the first time it mounts. That height is cached by step key.

2. **Freeze during the morph.** The outgoing and incoming steps are rendered as
   two `position: absolute` layers inside an `overflow: hidden` container. Absolute
   positioning means neither layer can push the other, so **the subtree is static
   during the transition** — no component re-renders, no relayout.

3. **Animate only two cheap things:**
   - **container height** → one float, JS thread. Cheap, because the subtree it
     contains is frozen (Yoga has nothing to recompute except the clip).
   - **opacity + translateY** of each layer → **native thread** (never stutters,
     even if JS is momentarily busy).

Net result: while the tray morphs, the JS thread is interpolating a **single
number**, and the compositor does the visible work. Smooth, no libraries.

```
             ┌─────────────────────────── Animated height (JS thread) ──┐
             │  overflow: hidden                                          │
             │  ┌──────────────┐   outgoing layer  (opacity 1→0, native) │
             │  │  step A       │   position: absolute  ← frozen          │
             │  └──────────────┘                                          │
             │  ┌──────────────┐   incoming layer  (opacity 0→1, native) │
             │  │  step B       │   position: absolute  ← frozen,         │
             │  │  (taller)     │     measured via onLayout               │
             │  └──────────────┘                                          │
             └────────────────── springs from A.height → B.height ────────┘
```

### Why not `LayoutAnimation`?

`LayoutAnimation` can also animate height with zero libraries, but it is
fire-and-forget: you can't interrupt it, compose it with a drag gesture, or
run different content transitions off the same value. The `Animated` approach
here keeps the height, the fade, and the drag all interruptible and coordinated.

---

## Anatomy

```
src/
  tray/
    DynamicTray.tsx   the engine: height morph + cross-fade + drag-to-dismiss
    springs.ts        the "Family feel" spring presets + native/JS driver notes
    theme.ts          colors, radii, spacing tokens
  ui/
    atoms.tsx         persistent chrome: header, primary/secondary button, chip, dot
  flows/
    RefuelFlow.tsx    V1 — forward flow ("push" transition)
    OptionsFlow.tsx   V2 — info reveal ("fade" transition)
App.tsx               demo host with launchers for both trays
```

The public API is small:

```tsx
<DynamicTray
  visible={open}
  steps={[{key: 'a', render: () => <StepA />}, {key: 'b', render: () => <StepB />}]}
  activeKey={step}         // change this -> the tray morphs to that step
  transition="push"        // 'push' (forward flow) | 'fade' (info reveal)
  onRequestClose={close}
/>
```

You drive it like a router: keep `activeKey` in state, change it, and the tray
measures the new step and springs to it.

---

## Run it

This is a complete bare React Native 0.75.4 app — the `ios/` and `android/`
native projects are included. Everything below runs **on your computer**, in a
terminal, in the project folder. Nothing is installed on the phone except (for a
device build) trusting the developer certificate once.

### One-time tools (macOS)

- **Node 18+** — `brew install node`
- **Watchman** — `brew install watchman`
- **Xcode** (from the App Store) + its command line tools — `xcode-select --install`
- **CocoaPods** — `sudo gem install cocoapods` (or `brew install cocoapods`)

### Get the code + install JS deps

```bash
git clone https://github.com/adimadethat/Dynamic-trays.git
cd Dynamic-trays
git checkout claude/dynamic-trays-react-native-m13pfj
npm install
```

### Install iOS native pods (first time, and after dep changes)

```bash
cd ios
pod install          # or: bundle install && bundle exec pod install
cd ..
```

### Run on the iPhone Simulator (no cable — easiest first check)

```bash
npm run ios          # boots a simulator and installs the app
```

### Run on your physical iPhone over USB

1. Plug the iPhone into the Mac with a cable. Unlock it and tap **Trust** if
   prompted.
2. Open the workspace in Xcode: `open ios/DynamicTrays.xcworkspace`
   (the `.xcworkspace`, **not** the `.xcodeproj` — pods live in the workspace).
3. In Xcode: select the **DynamicTrays** target → **Signing & Capabilities**:
   - Check **Automatically manage signing**.
   - **Team**: pick your Apple ID (add it under Xcode → Settings → Accounts if
     it's not listed — a free Apple ID works).
   - **Bundle Identifier**: change it to something unique, e.g.
     `com.yourname.dynamictrays` (the default `org.reactjs...` can't be signed by
     you).
4. At the top of Xcode, choose your iPhone from the device dropdown, then press
   **▶ Run** (or `npm run ios -- --device "Your iPhone Name"` from the terminal).
5. First launch on the device: iOS blocks untrusted developer apps. On the phone
   go to **Settings → General → VPN & Device Management → [your Apple ID] →
   Trust**, then reopen the app.

The Metro bundler (the JS server) starts automatically. If it doesn't, run
`npm start` in a second terminal tab. Shake the phone (or press `d` in Metro) for
the dev menu; edits to the JS reload live.

> Prefer no cables at all? Because the tray code is 100% core React Native, it
> also runs unchanged in **Expo Go** (scan a QR, no Xcode). Say the word and I'll
> add a small Expo harness.

> This was type-checked with `npm run tsc` (passes clean). The native projects
> are the stock RN 0.75.4 template, so `pod install` + Xcode build the standard
> way — but they were generated, not built against a simulator in this
> environment, so the first `pod install`/build happens on your Mac.

---

## Tuning the feel

All timing lives in `src/tray/springs.ts`:

- `HEIGHT_SPRING` — the height morph. More `stiffness` = snappier; more `damping`
  = less overshoot. Height looks best with ~zero overshoot.
- `CONTENT_SPRING` — the content scale/settle on cross-fade.
- `FADE_IN_MS` / `FADE_OUT_MS` — content cross-fade. Out is faster than in so the
  new content leads.
- `SCALE_IN_FROM` / `SCALE_OUT_TO` — the cross-fade scale endpoints: incoming
  grows from `SCALE_IN_FROM` → 1, outgoing shrinks to `SCALE_OUT_TO` as it fades.
- `FOOTER_SPRING` — the shared footer morph (Cancel reveal + primary shrink).
- `DRAG_SPRING` — the drag-release / dismiss feel.

The forward-flow vertical drift (`'push'` transition) is `PUSH_TRAVEL` in
`src/tray/DynamicTray.tsx`; set it to 0 for a pure scale dissolve.
