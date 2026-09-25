# "Who Keeps the Drone Up?" — Course Plan (Phase 1: Outline)

> **Working title:** *Who Keeps the Drone Up? A Feedback Adventure*
> **Driving question:** How does a machine keep itself where it's supposed to be?
> **Status:** Built. All 12 chapters implemented (see README for how to run).

---

## 0. Global decisions (apply to every chapter)

### 0.1 The cast
| Character | Role in the group | Signature move | Typical mistake |
|---|---|---|---|
| **Mika** | Curious, fearless | Asks the "dumb" question out loud | Cranks every slider to max "to see what happens" |
| **Theo** | Skeptical | "Wait — *why* does that work?" | Trusts a formula/table without checking where it came from, or refuses a tool until proven |
| **June** | Builder | "Can we try it on the drone?" | Over-engineers: "more is better" (more gain, more damping, more speed) |

- Drawn as simple original doodles (round-head Mika with a cowlick, tall Theo with square glasses, June with goggles on her forehead + a screwdriver). Each has a colour-neutral ink style so they never clash with the data colours.
- No expert. Occasionally a **sticky note from "past us"** (the group writing notes to their future selves) acts as a recap device.
- Every chapter has **one genuine mistake** listed below, shown on the page, and resolved by the group.

### 0.2 Colour language (legend pinned in the nav bar)
| Meaning | Colour | Mark |
|---|---|---|
| Setpoint / target | green | dashed line |
| Actual output (height, temperature) | blue | solid line |
| Error | red | shaded band between green and blue |
| Control effort (thrust, knob) | orange | solid line, own axis |
| Disturbance (wind, package, gravity) | purple | arrow / bar |
| Poles | black **×** | |
| Zeros | black **○** | |
| Previous run ("ghost") | same colour, 25% opacity, dashed | |

All colour-coded equation terms use the same tokens (KaTeX `\htmlClass`). Colours will be checked for WCAG AA against the paper background in both light and dark ("night notebook") themes, and every colour is paired with a line style so it's never colour-only.

### 0.3 The two recurring physical systems (fixed parameters, honest simplifications)

**The drone** (1-D vertical only)
- Mass `m = 0.5 kg`, gravity `g = 9.81 m/s²` → hover thrust `mg ≈ 4.9 N`.
- Vertical drag / rotor inflow damping `c = 1.0 N·s/m` (linear — *"we're pretending drag is proportional to speed; real drag is messier"*).
- Thrust limits `0 ≤ T ≤ 20 N` (thrust-to-weight ≈ 4, plausible for a small drone). **Chapters 1–7 pretend the motors are unlimited** (and can even pull down) so the linear maths is exact; this is said out loud, and the limit arrives in Ch 8 ("further left needs thrust we don't have") and stays for Ch 9–11.
- Ground: height can't go below 0 (drone sits on the floor until thrust > weight).
- Equation: `m ḧ = T − m g − c ḣ + F_wind`.
- Package: +0.2 kg (pickup) or −0.2 kg (drop).
- Introduced late (Ch 11 only): motor lag `τ_m = 0.05 s`, sensor noise `σ = 2 cm`.

Useful consequences we'll exploit (verified in §3):
- Open loop, extra 0.2 kg with fixed thrust → sinks at terminal speed `Δm·g/c ≈ 2 m/s` → crash within ~1 s. Dramatic, correct.
- P control with no gravity compensation: steady-state droop `e_ss = mg/Kp` (Kp = 5 N/m → 0.98 m droop; Kp = 2 N/m → never leaves the ground).
- Closed loop under P: `m ḧ + c ḣ + Kp h = Kp r − mg` → `ωn = √(Kp/m)`, `ζ = c / (2√(m Kp))`. Higher Kp ⇒ *less* damping ⇒ more wiggle. Exactly the Ch 2 discovery.
- Transfer function (height/thrust): `G(s) = 1 / (m s² + c s)`.
- PID closed-loop characteristic polynomial: `m s³ + (c + Kd) s² + Kp s + Ki`. Stable ⇔ `(c + Kd)·Kp > m·Ki` (all gains > 0). This gives a clean "cliff" learners can find by hand and see on the pole plot.

**The shower**
- Knob `u ∈ [0, 1]` mixes cold 15 °C and hot 60 °C → mixed temperature `T_mix = 15 + 45u` °C.
- Pipe transport delay `L = 2.5 s`, then first-order mixing/heat lag `τ = 1 s`.
- Target: 38 °C (± 1 °C comfort band).
- Transfer function: `G(s) = 45 · e^(−Ls) / (τ s + 1)` (°C per unit knob).
- Phase crosses −180° at `ω ≈ 0.95 rad/s` → natural "hunting" period ≈ 6.6 s. That's exactly the hot–cold–hot rhythm people feel. Critical proportional gain ≈ 0.031 knob-units/°C. (All to be re-verified numerically before Ch 10 is built.)

**Secondary systems** (brief, always tied back to the drone): cooling coffee (`τ ≈ 10 min`), filling tank, mass on a spring, cruise control (one panel in Ch 1).

### 0.4 Recurring interaction patterns
- **Predict card**: multiple choice *or* "sketch your guess" (draw on the plot with mouse/touch/keyboard-accessible fallback of choosing from 3 sketched curves). Guess is locked in, then the sim runs over it. Guess stays visible as a pencil line.
- **Sim transport**: play / pause / reset / single-step / speed (0.25×, 0.5×, 1×, 2×).
- **Ghost trace** of the previous run whenever a parameter changes.
- **Check yourself**: 2–4 items at the end of each chapter, each wrong answer gets its own explanation.
- **Concept map**: grows one or two nodes per chapter; clickable nodes jump back to the section that introduced them.
- **Margin notes**: handwritten asides, arrows pointing at plot features.

---

## 1. Chapter outlines

Legend for each chapter: **Q** = driving question · **Idea** = the one new idea · **Hook** = hands-on interaction · **Predict** = predict-then-reveal · **Misconception** · **Mistake** = the group's on-page error · **Check** = end-of-chapter questions · **Map** = concept-map nodes added · **Cliffhanger**.

---

### Chapter 0 — The Shower Problem
- **Q:** "Why can't I just get the shower to 38 °C?"
- **Idea:** *Reacting to what you feel right now, when what you feel is old news, makes you swing back and forth.* (Named later as "feedback with delay"; here it's only felt.)
- **Hook:** Full-width shower. Learner drags/arrow-keys a knob. A thermometer + live plot show the temperature arriving 2.5 s late. Goal: stay within 38 ± 1 °C for 10 s. A timer and "longest streak in the comfort band" score. Most people oscillate.
- **Predict:** Before a second attempt: *"If you turn the knob twice as fast/hard when you're off, will you get there sooner?"* (a) yes (b) same (c) worse. Then a "robot hand" that reacts twice as hard plays it out → worse swings. Then the "patient hand" (turn to ~0.51 and wait) → gets there calmly. Surprise: patience beats effort.
- **Misconception:** "If I'm off by more, I should correct more — harder is always better." (Mika.)
- **Mistake:** June is sure the shower is "broken" because it overshoots. Theo plots the knob (orange) against temperature (blue) and they see the blue curve is just the orange curve *shifted right*: it's not broken, it's late.
- **Check:**
  1. Which curve is the knob and which the temperature? (read the lag off a plot)
  2. You set the knob perfectly and walk away. What happens? (It settles — delay alone doesn't cause wiggles; *reacting* to delayed information does.)
  3. Pick the plot of a person who reacts too hard (3 sketched options).
- **Map:** `Goal (setpoint)`, `Delay`.
- **Cliffhanger:** "Machines do this all day without a brain. A drone stays at 2 m in the wind. How?"

---

### Chapter 1 — Open Loop vs. Closed Loop
- **Q:** "Can we just *tell* the drone what thrust to use?"
- **Idea:** *Feedback: measure what actually happened and use the difference to decide what to do.*
- **Hook:** Drone on a sketched backyard. Stage A (open loop): learner programs a thrust schedule ("climb at 6 N for X s, then hover at 4.9 N"). Calm air: it can be made to work. Then buttons add a gust (purple arrow) or a 0.2 kg package → the drone drifts away and never comes back (or crashes). Stage B: flip a switch to "look at the height": thrust = hover + something × (2 m − height) (a fixed gain, not yet adjustable). Disturbances now get corrected.
- **Predict:** "Package gets attached while hovering open-loop at 4.9 N. What happens?" (a) sinks a bit then stops (b) sinks and keeps sinking (c) nothing. Answer (b): with fixed thrust nothing tells it to stop sinking → it hits the ground at ≈2 m/s.
- **Block diagram introduced:** drawn *as the group draws it* on a whiteboard: first a single arrow "thrust → drone → height", then the sensor loop is added with a marker. Each box lights up when the matching part of the sim is active (linked representation). Vocabulary cards: **setpoint, error, controller, plant, sensor, disturbance**. Error shown as the red band.
- **Secondary:** One panel: cruise control on a hill (same diagram, different labels) — "same picture, different machine."
- **Misconception:** "If you get the numbers right, you don't need feedback." (Theo, who computes the perfect schedule.)
- **Mistake:** Theo's perfect schedule works in calm air — and the group celebrates — until June adds a light breeze. The lesson lands because the success was real first.
- **Check:**
  1. Label a block diagram of the shower (you are the controller; your skin is the sensor).
  2. Which of these are open loop? (toaster with timer, thermostat, washing machine timer, cruise control)
  3. Where does "the error" live on the diagram, and what's its sign when the drone is too low?
- **Map:** `Open loop`, `Closed loop / feedback`, `Block diagram`, `Error`, `Plant`, `Disturbance`.
- **Cliffhanger:** "Our loop has a mystery number in it — *how hard* to push per metre of error. What should it be?"

---

### Chapter 2 — Proportional Control
- **Q:** "How hard should the drone push when it's too low?"
- **Idea:** *Proportional control: thrust = Kp × error.* (One slider.)
- **Hook:** Kp slider (0–60 N/m, default 20). Drone takes off from the ground to a 2 m setpoint. Live height plot (blue vs green), thrust plot (orange), ghost of previous run. We deliberately **do not** add hover thrust — the controller has to fight gravity with error alone.
- **Predict:** "Kp = 5. Where does the drone end up?" (a) exactly 2 m (b) a bit below 2 m (c) above 2 m. Answer: ~1.02 m. Then "What if Kp = 2?" — it never takes off. Explained with the tug of war: to hold up 4.9 N, the error must be `4.9/Kp` metres.
- **Discoveries (guided):** low Kp → sluggish + big droop (steady-state error); high Kp → small droop but overshoot and wiggle. A "droop meter" and "overshoot meter" appear on the plot.
- **Misconception:** "More gain is always better." (June.) Also: "the drone should end up exactly at the setpoint — that's the point of control."
- **Mistake:** Mika sets Kp to 60 to kill the droop, gets a jittery bouncing drone, declares victory because the *average* height is close. Theo points at the red error band: it's never zero, it's just swinging.
- **Honest note (margin):** "With our simple drone, P control wiggles but never truly explodes. Real drones have delays that make too-much-gain dangerous — we'll meet that in Ch 9–10."
- **Check:**
  1. Kp = 10 N/m. How far below 2 m will it hover? (≈0.49 m — show the tug-of-war reasoning)
  2. Two plots: which had higher Kp? (the wigglier one with smaller droop)
  3. Mini-challenge: find a Kp where droop < 20 cm *and* overshoot < 30%. (Discovers it's impossible → "we need a better controller.")
- **Map:** `Proportional control (Kp)`, `Steady-state error`, `Overshoot`.
- **Cliffhanger:** "We keep saying 'sluggish', 'wiggly', 'settles'. We need a real language for *how things change over time*."

---

### Chapter 3 — The Language of Change
- **Q:** "How do we describe *how fast* something is changing?"
- **Idea:** *The derivative = speed = slope of the curve.* Then (as a separate section) *a rule for the speed determines the whole curve*, and (separately) *accumulating area undoes it.*
  - Split into 3 sections per the one-idea rule: **3a Slope as speed**, **3b "Rate depends on distance" → the exponential curve & time constant**, **3c Accumulating area**.
- **Hook (3a):** The drone's recorded height from Ch 2 is replayed. A draggable time cursor carries a tangent line; a speedometer shows its slope in m/s. Scrub, and a second plot draws the speed curve point by point.
- **Hook (3b):** Cooling coffee. The rule "cools faster the hotter it is compared to the room" (`dT/dt = −(T − T_room)/τ`). Learner *builds the curve by hand* using step buttons: each click moves forward Δt at the current slope. Then shrink Δt → smooth exponential emerges. Time constant ruler: after τ, 63% of the way there. Tank filling shown as a second example of the same shape.
- **Hook (3c):** "The drone's IMU tells us speed; where is it?" Speed plot with shading growing under the curve; the shaded area traces out the height curve.
- **Predict (3b):** "After 2 time constants, how much of the gap is closed?" (a) 100% (b) 86% (c) 126%. → 86%. Also: "does it ever *reach* room temperature?" (never exactly.)
- **Misconception:** "Speed is how high you are" / "a curve going down means slowing down." (Mika confuses value and slope — addressed with the drone at the top of an overshoot: highest point, zero speed.)
- **Mistake:** In 3b, June takes giant steps to save clicks. The hand-built coffee curve overshoots below room temperature and then oscillates — "the coffee froze?!" It's the step size, not the physics. (Quietly the same phenomenon as the shower, and the reason our sims use a careful integrator. Margin note: "our simulations use tiny, clever steps — RK4 — so this can't happen to them.")
- **Check:**
  1. Given a height plot, pick the matching speed plot.
  2. Coffee at 90 °C, room 20 °C, τ = 10 min. Roughly what's its temperature after 10 min? (~46 °C)
  3. Area under a speed curve (a rectangle and a triangle) → how far did the drone rise?
- **Map:** `Derivative (slope/rate)`, `First-order system`, `Time constant τ`, `Integral (accumulated area)`.
- **Cliffhanger:** Theo: "The coffee curve had a funny property — its slope was always proportional to how far it had to go. Is there a special function like that?"

---

### Chapter 4 — Why Exponentials Are Magic
- **Q:** "Is there a curve whose slope is just a copy of itself?"
- **Idea:** *`e^(at)` keeps its shape when you take its slope: slope = a × height.* Hence: *guess an exponential to solve a change rule.*
- **Hook:** Curve playground: pick a base (1.5, 2, e, 3) and drag a tangent-line cursor. A live readout shows slope ÷ height. For every exponential it's constant; for e it's exactly 1. Then `e^(at)` with an `a` slider: slope ÷ height = a everywhere. Overlay the curve's own slope curve — it's the same shape scaled by a.
- **Guess-an-exponential:** Back to coffee: try `T − T_room = C·e^(at)`, plug into the rule, find `a = −1/τ`. Theo checks it against the Ch 3 hand-built curve — overlap.
- **Predict:** "Take the slope of `e^(2t)`, then the slope of that. What do you get?" (a) `e^(2t)` (b) `4e^(2t)` (c) `2te^(2t)`. → (b): taking the slope twice multiplies by a twice. This is the seed of "differentiation becomes multiplication."
- **Misconception:** "e is just some random number mathematicians like." (Mika.) Resolved: it's the one base where slope ÷ height is exactly 1.
- **Mistake:** They try the guess on a mass on a spring (`m x'' = −k x`): plugging `e^(at)` in gives `m a² = −k` → `a² = −k/m`. Theo: "no number squares to a negative, so the guess failed." They conclude (wrongly) that springs can't be described by exponentials. This mistake **is** the cliffhanger — resolved in Ch 5.
- **Check:**
  1. Which curve has slope = −0.5 × height? (decaying, pick from 3)
  2. If `x = e^(−3t)`, what's `x'' + 3x'`? (0 — show the arithmetic)
  3. A tank empties following `h' = −h/20`. What's `a`, and what's the time constant?
- **Map:** `Exponential e^(at)`, `Guess-an-exponential (characteristic equation)`.
- **Cliffhanger:** "The drone and the spring *wiggle*. Exponentials only grow or shrink. Unless… a number can square to a negative?"

---

### Chapter 5 — Spinning Numbers
- **Q:** "What kind of number could square to −1 — and why would it wiggle?"
- **Idea:** *Complex numbers are arrows you can rotate; `e^(iωt)` is a point spinning around a circle, and `e^(st)` with `s = σ + iω` spins while growing or shrinking.* Split into sections:
  - **5a Numbers as arrows / multiplication as rotation:** ×(−1) is a half-turn. What's a quarter-turn? Call it `i`. Two quarter-turns = half-turn → `i² = −1`. "Not imaginary — just sideways."
  - **5b Spinning:** the velocity of a point moving around a circle is always 90° to its position → velocity = `iω` × position → exactly the "slope is a copy of itself" property from Ch 4, with `a = iω`. So `e^(iωt)` spins. Its shadow on the real axis is a cosine.
  - **5c Twin spinners:** a spinner and its mirror twin (`+iω` and `−iω`) add up to a purely real wiggle → why these values come in mirror pairs. Resolves the spring: `a = ±i√(k/m)`.
  - **5d The map of s:** `e^(st)`, `s = σ + iω`. **Interactive:** drag a point `s` on a plane (unnamed yet — "the map"); a 3-D-ish spiral and its shadow update live. Left half = shrinking spiral, right half = growing, on the vertical line = pure circle, on the horizontal line = no spin (plain exponential from Ch 4). Keyboard: arrow keys move `s`.
  - **5e Fourier nod (short):** add spinners of different speeds and see a square-ish wave form; one margin note: "someone named Fourier figured out *any* signal can be built this way."
- **Predict:** (5d) "Put `s` at −0.5 + 3i. Sketch the shadow." Learner picks from 3 sketches (growing wiggle, decaying wiggle, decaying no-wiggle), then it runs.
- **Misconception:** "Imaginary numbers aren't real / aren't physical." (Theo.) Answer: they're bookkeeping for rotation; the *shadow* is what we measure, and it's perfectly real.
- **Mistake:** Mika thinks the spring solution is `e^(i√(k/m) t)` alone and asks why the spring position is complex. The twin-spinner section resolves it.
- **Check:**
  1. What does multiplying by `i` twice do to the arrow 3? (→ −3)
  2. Match four `s` positions to four shadow plots.
  3. Where on the map would you put `s` for a guitar string that rings and slowly fades?
  4. Why do the spinners come in mirror pairs for a real object?
- **Map:** `Complex number as rotation`, `e^(iωt) spinning / sine as shadow`, `e^(st) spiral`, `The s-map` (renamed "s-plane" in Ch 7).
- **Cliffhanger:** June: "So *where* on this map does our drone live?"

---

### Chapter 6 — Second-Order Systems: The Drone's Real Personality
- **Q:** "Why does the drone bounce like a spring?"
- **Idea:** *Mass + spring + damper has two personality knobs: natural frequency ωn (how fast) and damping ratio ζ (how bouncy).*
- **Hook:** Physical mass-spring-damper animation next to the drone under P control. Side-by-side equations reveal they're the same equation (`k ↔ Kp`), with a margin note: "the controller *is* the spring — a virtual spring pulling towards 2 m." Two sliders (ωn, ζ) drive a 3-panel comparison: underdamped / critically damped / overdamped, plus a live s-map showing the two `s` values (roots of `m s² + c s + k`). As ζ increases the pair slides along a circle of radius ωn, meets on the real axis at ζ = 1, then splits apart along it.
- **Predict:** "Increase damping from ζ = 1 to ζ = 3. Does it settle faster or slower?" → slower. Surprise: more damping isn't always better.
- **Linked reps:** Drag ζ, and the drone, spring, step response and s-map roots all update together. Drone's `ζ = c / (2√(m Kp))` shown — explains *why* higher Kp made it wigglier in Ch 2 (callback).
- **Misconception:** "More damping = settles faster." (June.)
- **Mistake:** June sets ζ = 5 "to be safe" and the drone creeps up for ages. Mika notices one of the two `s` values is sitting very close to 0 on the map — "the slow one is in charge."
- **Check:**
  1. Match 3 response plots to 3 root patterns on the s-map.
  2. For the drone with Kp = 20 N/m, is it underdamped, critical, or overdamped? (compute ζ ≈ 0.16 → underdamped)
  3. What Kp would make the drone critically damped (ignoring droop)? (`Kp = c²/(4m) = 0.5 N/m` — and it wouldn't even take off. Why that's a problem → need more tools.)
- **Map:** `Second-order system`, `ωn and ζ`, `Response = sum of e^(st) terms`.
- **Cliffhanger:** Theo: "We guessed our way to these `s` values. With gravity, wind, packages and a controller, guessing gets ugly. Is there a machine that turns this calculus into algebra?"

---

### Chapter 7 — The Laplace Transform (the payoff)
- **Q:** "Can we turn calculus problems into algebra problems?"
- **Idea:** *Probe a signal with `e^(−st)` and total the area: `F(s) = ∫₀^∞ f(t) e^(−st) dt`. Slopes in time become multiplication by `s`.* Sections:
  - **7a The probe:** pick a signal `f(t)`; the probe `e^(−st)` (for real `s` first) multiplies it; the product and its shaded area animate. Slide `s`: area changes. Record area vs s as a curve being traced → that curve is `F(s)`.
  - **7b The explosion:** for `f = e^(at)`, the area is `1/(s − a)` and blows up as `s → a`. "The transform screams exactly at the `s` where the signal lives." (Seed for poles.) Then extend to complex `s` using Ch 5 spinners (probe unspins the signal).
  - **7c The key property:** `L{f'} = s F(s) − f(0)`. Shown first with `e^(at)` algebra on screen, then **with the learner's own hand-drawn signal**: both sides are computed numerically and matched. "It's not a lookup rule. It holds for anything you draw."
  - **7d Build the table ourselves:** step `1/s`, exponential `1/(s−a)`, sine `ω/(s²+ω²)` (via twin spinners), decaying sine `ω/((s+σ)²+ω²)`. Each row has its probe animation. Table grows row by row on the page.
  - **7e Solve the drone:** under P control, from rest on the ground with the setpoint and gravity as steps:
    `m s² H + c s H = Kp(R/s − H) − mg/s` → `H(s) = (Kp·r − mg) / (s(m s² + c s + Kp))`.
    Partial fractions step by step (with a "why partial fractions?" aside: splitting into table rows). Result overlaid on the RK4 simulation — they coincide. Droop `mg/Kp` falls out as the `1/s` term → Ch 2 callback.
  - The plane is officially named the **s-plane** here.
- **Predict:** (7a) "For `f(t) = 1` (a step), what happens to the area as `s` gets bigger?" (a) grows (b) shrinks (c) stays. → shrinks (`1/s`). (7e) "Will the formula match the sim?" — and the first attempt doesn't (see Mistake).
- **Misconception:** "The Laplace transform is just a lookup table." (Theo.) Resolved by building every row and testing the derivative rule on a hand-drawn curve.
- **Mistake:** The group solves the drone starting at 1 m (a ledge) and forgets the `f(0)` term. Their formula and the sim disagree at `t = 0`. Theo finds the missing `−h(0)` terms. After fixing, the curves overlap perfectly.
- **Check:**
  1. What's the transform of `3e^(−2t)`? (`3/(s+2)`)
  2. If `F(s) = 5/(s+4)`, sketch/pick `f(t)`.
  3. Using the derivative rule: transform of `x' + 2x = 0`, `x(0) = 1` → `X = 1/(s+2)` → `x = e^(−2t)`.
  4. Why does `1/(s−a)` blow up at `s = a`? (the probe exactly cancels the growth → infinite area)
- **Map:** `Laplace transform (probe + area)`, `Derivative → × s`, `Transform table`, `s-plane`.
- **Cliffhanger:** June: "Every time we solved something, the answer was (stuff)/(polynomial in s). What if that fraction *is* the drone?"

---

### Chapter 8 — Transfer Functions, Poles and Zeros
- **Q:** "Can we read a system's whole personality off one fraction?"
- **Idea:** *Transfer function = output ÷ input in s-land (zero initial conditions). Its poles (where the denominator is 0) are the `e^(st)` terms the system is built from.* Zeros as a short second section.
- **Hook / CENTERPIECE:** **Pole playground.** Draggable conjugate pole pair on the s-plane. Linked in real time: step response (with ghost), physical drone animation, the transfer function with colour-coded coefficients, and the equivalent controller (the pair sets `m s² + (c + Kd) s + Kp`, so we display the Kp and damping the drone would need). Shaded regions: left half "calms down", right half "explodes". Guides: vertical lines "settling time", rays "overshoot %", horizontal lines "wiggle frequency". Keyboard: select pole, arrow keys move it; screen-reader description updates ("poles at −2 ± 4i, settles in ≈2 s, overshoots ≈20%").
- **Predict:** "Drag the poles to the right half-plane. What does the drone do?" (a) lands (b) hovers wobbly (c) oscillates with growing swings and crashes/flies off. Then run. Also: "Move poles straight up. What changes?" (faster wiggle, same decay envelope).
- **Zeros (short):** a PD-style closed loop `(Kd s + Kp)/(…)` has a zero. Drag the ○: close to the origin → extra overshoot/"kick" even with the same poles. One intuitive line: "a zero is a frequency the system blocks; near the origin it makes the system react to *changes* strongly." Sets up derivative kick in Ch 9.
- **Misconception:** "Moving poles further left is always better." (June.) The orange thrust plot shows it needs huge thrust spikes → hits the 20 N limit → reality stops obeying the linear picture.
- **Mistake:** Mika drags just one pole off the real axis and it won't separate from its twin — frustrated. Callback to Ch 5c: real systems have mirror-twin spinners, so poles move in pairs.
- **Check:**
  1. Given 4 pole diagrams, rank them by settling time.
  2. `G(s) = 3/(s² + 2s + 10)`: where are the poles? stable? wiggly? (−1 ± 3i; yes; yes)
  3. Mini-challenge: place poles so overshoot < 10% and settling < 2 s (region highlights when met).
  4. Which pole in a pair of real poles (−0.2 and −5) dominates the response, and why?
- **Map:** `Transfer function`, `Poles`, `Zeros`, `Stability (left half-plane)`.
- **Cliffhanger:** Theo: "The poles are nice, but the drone still droops under gravity. Our controller is the problem, not the map."

---

### Chapter 9 — PID: Fixing Everything
- **Q:** "How do we kill the droop *and* stop the wiggle?"
- **Idea (one per section):**
  - **9a Integral:** *accumulate past error (Ch 3c area!) and push by that.* The droop can't survive: as long as error ≠ 0, the pile keeps growing. Shown with the error area shading and the orange integral contribution rising until gravity is exactly cancelled.
  - **9b Derivative:** *push against the speed of the error* — a virtual damper (Ch 6 callback, adds to `c`).
  - **9c Poles move:** each gain's effect on the 3 closed-loop poles of `m s³ + (c + Kd)s² + Kp s + Ki`. Sliders drag poles in real time.
  - **9d Playground:** Kp, Ki, Kd sliders + live response + pole plot + scoreboard (overshoot, 2% settling time, steady-state error, peak thrust). Stars for meeting targets.
  - **9e Warnings:** (i) derivative kick when the setpoint jumps (fix: derivative on measurement); (ii) sensor noise amplified by D (toggle noise, watch orange go fuzzy; fix: filter). Short, visual.
- **Predict:** "Add a big Ki to fix droop faster. What happens?" (a) droop vanishes quickly and cleanly (b) droop vanishes but it wiggles more (c) it can go unstable. → (b), and past the cliff (c). The stability boundary `(c + Kd)·Kp = m·Ki` is drawn on a Ki-vs-Kd mini-map with a dot for the current gains.
- **Misconception:** "The D term predicts the future." (Mika.) It only extrapolates the current slope, and noise makes its "prediction" wild.
- **Mistake:** Mika cranks Ki to kill droop instantly; poles cross into the right half-plane and the drone oscillates wildly. June adds Kd, which pulls them back — group realises the terms trade off.
- **Also briefly:** integrator windup while the drone sits on the ground (thrust pegged at 20 N) — shown in one margin note and a toggle; full treatment deferred to "where next".
- **Check:**
  1. Which term fixes steady-state error, and why can't P alone?
  2. Adding Kd moves the poles which way? (left/more damped)
  3. Mini-challenge: overshoot < 5%, settle < 2 s, zero droop, peak thrust < 20 N.
  4. Why is derivative on measurement better than on error when the setpoint jumps?
- **Map:** `Integral action`, `Derivative action`, `PID`, `Noise & derivative kick`.
- **Cliffhanger:** June: "We could build a shower controller now… but when I tried, it wiggled exactly like we did in Chapter 0. What is it about *delay*?"

---

### Chapter 10 — Back to the Shower: Delay and Robustness
- **Q:** "Why did we oscillate in the shower — and how close to the edge is any controller?"
- **Idea (one per section):**
  - **10a Delay = lag in time = lag in phase:** a sine going through a 2.5 s delay comes out shifted; the shift *in degrees* grows with frequency (`ωL`). Animated: the same delay is a small nudge for a slow wave and a half-cycle for a fast one.
  - **10b Frequency response:** feed sine waves of chosen speed into the shower; measure output size and lag; **each measurement drops a dot onto two plots** (gain & phase vs frequency). After ~8 dots, the analytic Bode curve fades in over them — "we just drew a Bode plot by hand."
  - **10c Margins:** where phase hits −180° a wave comes back perfectly flipped — "pushing a swing at the wrong moment." If the loop gain there ≥ 1, it self-sustains. Gain margin and phase margin drawn as "distance to the cliff edge." Ch 0 callback: the human reacting hard had gain > 1 at ≈6.6 s period → oscillated at ≈6.6 s. We replay the learner's own Ch 0 run next to the prediction.
  - **10d Design the robot shower:** PI controller with sliders; margins shown live; beat your Ch 0 score (time-to-comfort and time-in-band) against your saved run.
- **Predict:** "Double the pipe delay. Does the critical gain go up or down?" → down; the cliff gets closer.
- **Misconception:** "Delay only makes things slower, it can't make them unstable." (Theo.)
- **Mistake:** June's first robot shower uses the aggressive PID from the drone. It oscillates at the same period as the learners did in Ch 0. Group realises: the drone had no big delay; the shower does, so a robust design needs gentler gains (margin), not more cleverness. (Honest aside: fancier fixes like a Smith predictor exist — "where next".)
- **Check:**
  1. A 2 s delay at a wave with 8 s period: how many degrees of lag? (90°)
  2. Read gain and phase margin off a given Bode plot.
  3. Why does a longer delay force a gentler controller?
  4. Mini-challenge: phase margin > 45° while reaching 38 °C within 12 s.
- **Map:** `Phase lag`, `Frequency response / Bode plot`, `Gain & phase margin`, `Robustness`.
- **Cliffhanger:** "We have everything. Time for the real test."

---

### Chapter 11 — Finale: The Drone Challenge
- **Q:** "Can *you* keep the drone at 2 m through everything?"
- **Idea:** *Putting it together under realistic conditions* (the only new ingredients — motor lag, sensor noise, derivative filter, saturation — are each introduced in a single margin note, honestly labelled as "real-world grit").
- **Hook:** Sandbox with Kp, Ki, Kd, derivative filter, derivative-on-measurement toggle. Scripted 20 s mission: take off → 2 m; wind gust (±1.5 N, 3 s) at t = 6 s; package drop (−0.2 kg) at t = 12 s; sensor noise throughout. Live s-plane (nominal model), response, thrust, and a mission checklist.
- **Pass criteria (tuned and verified during build; draft):** reach 2 m ± 5 cm within 3 s; overshoot < 10%; max deviation during gust < 20 cm; after package drop back within ± 5 cm in 2 s; never touches ground after take-off; thrust saturates < 0.5 s total. Stars for each; "gold" for all.
- **Predict:** "Before you tune: which term will matter most for the package drop?" (Ki — the weight changed; only integral re-finds the new hover thrust.)
- **Misconception:** "A controller tuned for calm air is tuned." (June.)
- **Mistake:** Their high-Kd "perfect" calm-air tune fails with noise on — the motors chatter. They add the filter and trade a little speed for calm.
- **Reflection:** Each character says what they now understand (tying to their arc: Mika learned to ask, Theo learned *why* Laplace works, June learned "more" isn't "better"). **Full concept map revealed** with all edges animating in.
- **Where next:** root locus (drag *gain* and watch poles move), state-space control (many sensors, many motors), digital control (sampling), Kalman filters (fighting noise smartly), Smith predictor (delay compensation), nonlinear drag and 3-D drones.
- **Check:** Self-assessment of the mission is the check; plus 3 "explain to a friend" reflection prompts with model answers.
- **Map:** everything connected; final node `You`.

---

## 2. Technical plan

### 2.1 Stack (proposal — see open questions)
- **Vite + TypeScript + pnpm**, framework-free (vanilla TS modules). Content pages are mostly static prose + interactive islands; no framework needed, keeps the bundle small.
- **Rendering:** Canvas 2D for plots and sims (fast, 60 fps with thousands of points), SVG for block diagrams, s-plane and concept map (crisp, accessible, easy to make draggable). **Rough.js** for sketchy strokes (cached, not re-roughened each frame to avoid jitter); **KaTeX** for math; fonts **Caveat** (dialogue/margins) + **Atkinson Hyperlegible** or **Source Serif** (body). No D3 unless needed (own tiny scale helpers).
- Deploy target: static site (any host).
- Tooling per your global rules: oxlint, oxfmt, Vitest, Playwright/agent-browser.

### 2.2 Shared components (each reusable, keyboard-operable)
| Component | Responsibility |
|---|---|
| `sim/integrator` | Fixed-step RK4 (Δt = 1 ms, sub-stepped per frame), deterministic, with **delay line** (ring buffer) for the shower and saturation hooks |
| `sim/drone-model`, `sim/shower-model`, `sim/msd-model` | Pure functions: state → derivatives. Parameters in one file. |
| `sim/controller` | P / PI / PID with derivative-on-measurement, filter, anti-windup clamp |
| `ui/plot` | Time plots: multiple series, units, labelled axes, ghost trace, predict-sketch overlay, cursors |
| `ui/s-plane` | Draggable poles (conjugate-locked) / zeros, regions, guides, keyboard nudge, live ARIA description |
| `ui/spiral` | e^(st) spiral with shadow projection |
| `ui/block-diagram` | SVG boxes/arrows with signal highlighting |
| `ui/drone-view`, `ui/shower-view`, `ui/msd-view` | Physical animations driven by sim state |
| `ui/transport` | Play / pause / reset / step / speed |
| `ui/slider` | Label, value, unit, keyboard steps, ARIA |
| `story/dialogue`, `story/margin-note`, `story/predict-card`, `story/check-yourself`, `story/concept-map` | Narrative pieces |
| `math/laplace`, `math/roots`, `math/bode` | Numerical Laplace integral, polynomial roots (Durand–Kerner / companion), analytic 2nd-order responses, frequency response incl. delay |

### 2.3 Accessibility & responsiveness
- Every slider and draggable is keyboard-operable; s-plane poles move with arrow keys (Shift = bigger steps).
- Each interactive has a live text description (`aria-live="polite"`, throttled).
- `prefers-reduced-motion`: sims start paused, spirals render as static traces, no auto-animations.
- Layout: single column on phones (≥ 320 px), side-by-side linked views from 768 px, full "desk" layout at 1024+.
- Light "paper" and dark "night notebook" themes, both checked for AA contrast.

### 2.4 Correctness & verification (automated, Vitest)
1. RK4 vs analytic 2nd-order step response (under/critically/over-damped): max error < 1e-6.
2. Drone P-control steady state = `r − mg/Kp`; open-loop sink speed = `Δm·g/c`.
3. Numerical Laplace integral vs table rows (step, `e^(at)`, `sin`, decaying sine) at several `s`: rel. error < 1e-4.
4. Derivative rule `L{f'} = sF − f(0)` checked numerically on random smooth signals.
5. Ch 7 partial-fraction solution vs simulation (including non-zero initial height).
6. PID Routh boundary `(c+Kd)Kp = m Ki` vs simulated growth/decay on both sides.
7. Shower: phase-crossover frequency and critical gain vs simulated sustained oscillation; Bode dots vs analytic `|G(iω)|`, `∠G(iω)`.
8. Delay line exactness; integrator stability at extreme slider values (max gains, min damping).
9. Every quiz's "correct answer" computed by the same model code (no hand-typed numbers that can drift).

### 2.5 Build order (each phase = one or more commits)
1. **Phase 1:** Scaffolding, design tokens, fonts, nav + progress, concept-map shell. Shared sim core + tests (§2.4 items 1, 2, 8).
2. **Phase 2:** Shared UI: plot, slider, transport, s-plane, dialogue, predict card, check-yourself.
3. **Phase 3:** Chapters 0–2 (shower sim, drone sim, block diagram).
4. **Phase 4:** Chapters 3–5 (tangent/area tools, exponential playground, spiral + s-map).
5. **Phase 5:** Chapters 6–8 (MSD, Laplace probe, pole playground) + tests 3–5.
6. **Phase 6:** Chapters 9–10 (PID, Bode builder, margins) + tests 6–7.
7. **Phase 7:** Chapter 11 finale, full concept map, narrative/continuity review, a11y and breakpoint pass (375 / 768 / 1024 / 1440).

---

## 3. Open questions for you
1. **Stack vs. your global rules.** The brief says "HTML/CSS/JS, minimal deps, CDNs"; your global setup prefers pnpm + Vite (+ React/shadcn for apps). I propose **Vite + TypeScript, no framework**, dependencies via pnpm (Rough.js, KaTeX). OK, or do you want React, or a zero-build CDN-only site?
2. **i18n.** Your global rules say no hardcoded strings. For a narrative course that means all prose/dialogue lives in `/public/locales/en/*.json` (one namespace per chapter). Worth doing here, or keep prose in per-chapter content files and only extract UI strings?
3. **Chapter granularity.** One URL per chapter (hash routing), with sections scrolling within a chapter. OK?
4. **Progress persistence.** Save progress, predictions and the learner's Ch 0 shower run in `localStorage` so Ch 10 can replay it. OK?

## 4. What's next
After approval: Phase 1 (scaffold + tested sim core), then chapters in order, testing each interactive at extreme values before moving on.
