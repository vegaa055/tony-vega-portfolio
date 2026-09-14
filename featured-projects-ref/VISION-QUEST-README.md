# Vision Quest

A polyphonic, multi-engine software synthesiser in the mould of Arturia Pigments:
two swappable sound engines per voice, a dual filter section with serial and
parallel routing, a colour-coded modulation matrix, and a master effects rack.
Built on JUCE 9, shipping as VST3 and a standalone app.

Company: Astral Vega Audio. Successor project to Astral Vega, whose band-limited
wavetable code, effects rack and tempo-division tables are carried over here.

---

## Current state

All six planned engines are implemented.

**Implemented**

| Area | What's there |
| --- | --- |
| Engines | Two independent slots (A/B), each selectable as **Analog**, **Wavetable**, **Granular**, **Sample**, **Harmonic** or **Modal** |
| Analog | Three oscillators (sine/triangle/saw/pulse), PolyBLEP band-limiting, hard sync, ring mod, per-oscillator drift |
| Wavetable | 10 factory tables + 8 import slots, morph across frames, 5 phase-warp modes, up to 8-voice unison with stereo spread |
| Granular | 64-grain pool per voice, position/spray/size/density/pitch/jitter/spread/reverse/window shape |
| Sample | Start/end region, forward and ping-pong looping, reverse, chromatic or fixed pitch, and time-stretch independent of pitch |
| Sample pool | Shared by both — 10 built-in sources plus 16 import slots, stereo. Auto-loads a folder beside the plugin at startup; **Import...** takes a multi-selection; root note detected per sample |
| Harmonic | Additive bank of up to 64 partials, shaped by tilt, odd/even balance, spectral comb, movable formant and inharmonic stretch |
| Modal | Up to 32 tuned resonators over four structures (string, beam, membrane, tube), struck by impulse, mallet or noise burst, or bowed |
| Utility | White/pink noise generator with its own filter routing |
| Filters | Two filter slots — morphing SVF (LP→BP→HP), ZDF transistor ladder, tuned comb — serial or parallel, per-source routing and blend |
| Modulation | 3 envelopes, 3 LFOs, 3 drawable function generators, 16-slot matrix, 25 destinations, 17 sources |
| Sequencer | Arpeggiator (6 orders, up to 4 octaves) and a 16-step sequencer sharing one clock — tempo-synced or free, swing, gate, latch, four directions |
| Step lanes | Pitch, velocity, gate (rest/note/tie) and two mod lanes into the matrix, each with its own length for polyrhythms |
| Function generators | Three, each up to 16 breakpoints with curved segments, one-shot or looping, free or tempo-synced, unipolar or bipolar; drag to edit, double-click to add or remove |
| Effects | Three buses of three interchangeable slots, 16 algorithms — drive, bitcrush, filter, compressor, phaser, chorus, delay, reverb, flanger, tremolo, ring mod, EQ, gate, width, multiband compressor, shimmer reverb — with per-bus input routing and output level |
| Voicing | Poly / Mono / Legato, up to 16 voices, glide, pitch bend |
| Keyboard | On-screen keyboard plus an FL Studio-style QWERTY typing keyboard, same mapping as Astral Vega |
| Presets | 8 factory patches plus user presets on disk; browser in the header with prev/next, save and delete |
| UI | Pseudo-3D wavetable display, grain and sample waveforms with drag-to-scrub, dB spectrum views for Harmonic and Modal; colour-coded modulation; resizable layout |

Everything in the original brief is now implemented. Obvious next steps would be
more effect algorithms (the slot architecture makes each one a single `case`),
more factory presets, and a proper installer.

---

## Building

Requires CMake 3.22+, a C++17 compiler, and **JUCE 9.0.0 at `./JUCE`**. JUCE is
gitignored rather than vendored — copy or clone it into place first:

```bash
git clone --branch 9.0.0 --depth 1 https://github.com/juce-framework/JUCE.git JUCE
```

Then configure and build:

```bash
cmake -B build -G "Visual Studio 17 2022" -A x64
```

```bash
cmake --build build --config Release --parallel
```

Artefacts land in `build/VisionQuest_artefacts/Release/` — `VST3/Vision Quest.vst3`
and `Standalone/Vision Quest.exe`.

## Testing

`Tools/RenderTest.cpp` builds a console harness that drives the processor
headlessly: it plays a note through each engine, filter type and modulation
routing, checking every configuration produces audible, finite output, then
builds the editor and paints every tab offscreen. Run it after touching DSP or
UI code — a Debug build has JUCE's assertions live, and the harness prints a
stack trace when one fires.

```bash
cmake --build build --config Debug --target VisionQuestRenderTest --parallel
```

```bash
./build/VisionQuestRenderTest_artefacts/Debug/VisionQuestRenderTest.exe
```

It also writes `editor-preview-*.png` for each tab, which is the quickest way to
check a UI change without loading a host.

---

## Architecture

```
Source/
  Core/        Params (layout + ids), ParamCache (audio-thread reads),
               SynthVoice, VisionSynth (poly/mono/legato), ModDefs
  Engines/     Engine interface, AnalogEngine, WavetableEngine,
               Wavetable (FFT + mip chain), WavetableBank
  Filters/     MorphFilter (TPT SVF), FilterSection (dual slot + routing)
  Mod/         Envelope, LFO, ModMatrix
  FX/          FXChain (master rack)
  GUI/         LookAndFeel, ParamControls, WavetableDisplay, panels
```

A few decisions worth knowing before changing things:

**Voices render in 32-sample chunks.** Envelopes, LFOs, the matrix and every
derived parameter update once per chunk; engines and filters run per sample
inside it. Amplitude is ramped across the chunk so level changes never click.

**Engines expose two generic modulation destinations** (`shapeA` / `shapeB`)
rather than named ones. For Analog they mean pulse width and ring mod; for
Wavetable, table position and warp amount. This is what keeps the matrix from
growing every time an engine is added.

**LFO rate is a modulation destination fed by LFO values**, which is circular.
The voice breaks the cycle with the previous chunk's matrix output — at 32
samples the lag is inaudible.

**Choice parameter indices are persisted in presets**, so entries in the enums
in `Params.h`, the `ModSource`/`ModDest` enums in `ModDefs.h`, and the factory
table list in `WavetableBank.cpp` may only ever be *appended* — reordering them
silently changes the sound of saved patches. This is why `srcFunction2` and
`srcFunction3` sit at the *end* of the `ModSource` enum rather than next to
`srcFunction1` — the source menu reads a little oddly as a result, and that is
the deliberate price of not repointing every routing in every existing patch.
`modSourceForFunction()` is the single place that knows they aren't contiguous;
everything else indexes functions 0..numFunctions-1.

**The function generator's shape is not made of parameters.** A variable number
of breakpoints doesn't map onto a fixed parameter list, and per-point automation
isn't useful — the shape is part of the patch. It lives in the plugin's state
tree instead, written by hand in `getStateInformation` alongside the APVTS
parameters.

**The shape reaches the audio thread through a seqlock** (`LockFreeHolder`,
shared with the sequencer's step pattern). The editor bumps a version to odd,
writes, then bumps it to even; a reader that sees an odd version or one that
changed mid-copy keeps the value it already had. Taking the audio callback lock
instead would block the audio thread on every mouse-move while dragging a
breakpoint or a step. The processor snapshots once per block so all voices
evaluate the same shape.

**Editors holding a working copy must watch the holder's version.** Loading a
preset republishes the shape and the pattern behind the editor's back; without
the version check the editor would go on showing — and re-publishing — stale
data. `FunctionEditor` and `StepGrid` both re-read when the version moves
without them.

**The sequencer rewrites MIDI rather than driving voices directly.** It sits
between the keyboard and the synth, consuming held notes and emitting generated
note-on/off pairs at sample-accurate offsets, so voice allocation, glide and
envelopes all behave exactly as if the notes had been played. In Off mode the
buffer is left completely untouched, so it can neither cost anything nor alter
timing when it isn't wanted.

**A step due in under a sample is due now.** The sequencer's block loop
advances by an integer number of samples, so testing `samplesToNextStep <= 0`
leaves a sub-sample remainder that can never be advanced past — no state
changes and the loop never terminates, hanging the audio thread. Swing is what
makes the step length stop being a whole number of samples, so only swung
patterns hit it. The condition is `< 1.0`, and there's a bounded-iteration
guard behind it because a runaway loop here is fatal rather than merely wrong.

**Every effect slot exposes the same four controls**, three character
parameters and a mix, rather than each algorithm exposing its own set. That's
what makes slots interchangeable: the parameter list doesn't change shape when
you swap a chorus for a reverb, so automation survives the swap and the editor
only has to relabel four knobs. `FXSlot::parameterName` is the single source of
truth for those labels, so the UI can't claim a knob does something the DSP
doesn't. Adding an algorithm is a `case` in `setParams` and `process`, plus a
row in `parameterName`.

**All 328 parameters are exposed to the host and automatable**, so DAW
automation clips (FL Studio's included) work without anything plugin-side.
What *isn't* automatable is the patch data that deliberately isn't made of
parameters — function generator shapes, sequencer step values and lane lengths,
and which sample is in a slot. Those are saved with the patch but can't be
drawn on an automation clip; to move them over a song, route a modulator to
them internally or automate a parameter that scales the result.

**Host automation must not mark the patch edited.** A host replaying a clip
moves parameters without sending gestures, and a user turning a knob does —
that distinction is the only thing separating the two. Without it the preset
name showed its "edited" asterisk through any automated passage, making it look
as though stepping to the next preset would discard work.

**Anything applied as a per-block constant steps under automation.** A host
delivers one value per block, so FX slot mix and bus level are ramped across
the block rather than set once. The test measures the largest sample-to-sample
jump against the same render with the parameter held still, since what matters
is whether automation introduced a discontinuity the signal didn't already have.

**Shimmer's feedback loop has to lose energy each pass.** Every pass moves the
tail up an octave and back into the reverb, so without a low pass in the loop
the gain exceeds one and it runs away — it reached a peak of 2.7 before that was
added, which the per-algorithm sweep caught. The filter is what real shimmer
reverbs use; the soft clip behind it is a ceiling for settings that still get
close.

**Buses are processed in order and only read earlier ones.** Bus A always takes
the synth; B may take A; C may take A or B. That covers what a routing matrix
would, with one control per bus instead of a grid, and makes a feedback cycle
impossible by construction. With every slot Off, bus A is a straight wire —
which is the dry path, so there's no separate dry control.

**A preset is exactly what a session save contains.** `captureState` and
`applyState` are shared by the host's state callbacks and the preset manager,
so a patch that recalls correctly in a session recalls correctly as a preset.
Sample slots store their file paths, or a preset would play whatever audio
happened to be loaded; a missing file leaves the slot alone rather than
clearing it.

**Factory presets are code, not files.** Each is a name and a function that
configures parameters from the defaults — nothing to install, and nothing to go
stale when a parameter's range changes. They're applied *after* a reset to
defaults, or the previous patch bleeds through.

**Presets are deliberately not exposed as host programs.** The list changes
whenever the user saves, and hosts that snapshot the program list at load time
cope badly with that. The in-plugin browser is the reliable path.

**Each sequencer lane wraps at its own length.** That's the whole point of the
polyrhythm — a five-step gate lane against a seven-step pitch lane repeats every
thirty-five steps — and it's why `SequencerPattern::valueAt` takes a lane rather
than sharing one counter. The grid dims steps beyond a lane's length rather than
hiding them, since a lane shorter than sixteen is a musical decision that needs
to be visible.

**Wavetables are band-limited via a mip chain.** Each frame is stored at 11
levels holding progressively fewer harmonics, and playback picks the brightest
level that won't alias at the current pitch. Phase warping adds bandwidth back,
so the mip choice is scaled by the warp's steepest slope.

**Built-in sample sources are rendered, not raw tables.** Each one is the
band-limited wavetable oscillator run at C3 for two seconds while the morph
position sweeps the table. Concatenating raw single-cycle frames instead would
force playback at roughly eleven times their stored rate to reach a musical
pitch, which aliases badly; rendering at a real pitch first means playback only
stretches a little either side of C3. Imported samples assume the same C3 root.

**The Sample engine time-stretches through two-head overlap-add, always.** Each
head reads at the rate that sets *pitch*, while the cursor spawning heads walks
the source at the rate that sets *speed*. Hann windows at 50% overlap sum to
exactly one, so at a stretch of 1.0 the heads stay phase-coherent and the path
is transparent — which is why there is deliberately no separate "no stretch"
branch to jump between when the control is automated through 1.0.

**Sample loop points are positions in the whole sample**, not within the
start/end region, so a patch can play an attack from `start` and then fall into
a sustain loop the way a sampler does. A loop shorter than 64 samples is
ignored rather than spun into a buzz.

**Additive partials are indexed by harmonic number, never compacted.** A
partial that falls below the audibility threshold for one block and returns
must find its own phase again — reusing a compacted slot would hand it another
harmonic's phase and click. Partials above Nyquist are dropped rather than
folded, which is both the anti-aliasing strategy and why high notes cost far
less CPU than low ones.

**Modal resonator gain needs `sin(w)` folded in.** A two-pole resonator's
impulse response carries a `1/sin(w)` factor, so without that the low modes
come out enormously louder than the high ones — the engine was peaking around
5.0 while every other engine sat near 0.2. Under continuous (bowed) excitation
the resonator integrates rather than rings down and its output power grows as
`1/(1-r^2)`, so the input is scaled by the square root of that instead. Bowing
also caps the decay used for the resonator at one second: a twenty-second decay
takes twenty seconds to reach full amplitude, which reads as silence for the
whole of a normal note.

**Every exciter type is energy-normalised through the same expression.**
Anything through the one-pole tone control keeps `a/(2-a)` of its energy,
impulse and noise alike, and a raised-cosine noise burst carries `length/8` of
a unit impulse's. Normalising both means changing exciter or tone changes
character rather than level.

**Samples auto-load from a folder beside the plugin.** `Vision Quest Samples`,
resolved by `SampleBank::resolveStartupFolder` — for the standalone that's next
to the executable, and for a VST3 it deliberately walks back out of the bundle
so the folder sits beside the `.vst3` rather than buried in
`Contents/x86_64-win` where nobody would look. Files load in name order, capped
at the number of import slots, and the scan happens in the processor's
constructor so no audio callback can be running while the slots fill. The
**Folder** button in the editor shows the resolved path and can create it.

**Sample roots are detected, not assumed.** A real sample pack turned out to
span C2 to C5, so a fixed C3 root would have transposed most of it by an octave
or more. `SampleBank::estimatePitch` estimates the fundamental by
autocorrelation at import and rounds to the nearest semitone. It is deliberately
conservative — it returns nothing for noisy or percussive material, and chords
can still fool it — so the result is only ever a default the engine's own
octave/semitone/fine controls can override. The waveform view prints the root it
settled on so a bad guess is visible rather than only audible.

**Note naming uses scientific pitch (middle C = C4) everywhere except the
Keyboard tab**, which keeps Astral Vega's FL Studio-style numbering (middle C =
C5) because matching that synth's layout was the point of the panel. `noteName`
in ParamControls.h is the shared helper for everything else.

**Importing a sample must hold off the audio callback for the swap.** Voices
dereference the bank on the audio thread and keep the resulting pointer for the
length of a render chunk, so freeing the previous `SampleData` while one is
mid-render reads freed memory. `VisionQuestProcessor::loadSampleIntoSlot`
decodes the file first — the slow part, and it touches nothing shared — then
takes `getCallbackLock()` only for the pointer swap and the free. Call
`SampleBank::installUserSlot` directly and that protection is gone.

**Sample slot names are display-only.** The choice parameter's entries are
fixed at "Sample 1..8" because host automation and saved presets index into
them; the combo's item *text* is relabelled with the loaded file names, leaving
indices untouched. Views also cache waveform peaks by slot index, which can't
tell that a slot was reloaded with different audio — hence `SampleBank`'s
generation counter.

**The spectrum views compute from the engines' own static helpers**
(`HarmonicEngine::partialAmplitude`, `ModalEngine::modeRatio` and friends), not
a parallel implementation. A spectrum display that drifts from what you hear is
worse than no display.

**Grains outlive the block that spawned them**, so they live in a fixed pool and
are recycled. When every slot is busy a spawn is skipped rather than stealing a
sounding grain — thinning the cloud is inaudible, cutting a grain mid-window
clicks.

**Typing-keyboard focus lives on the editor, not the Keyboard tab.** Key events
land on whichever control has focus and bubble up to `VisionQuestEditor`, which
forwards them to `KeyboardPanel`. That's what lets typing play notes from any
tab. Each key stores the note it actually started so an octave change mid-hold
releases the right note, and the editor releases everything on focus loss.

**MSVC needs `/utf-8`.** Sources are UTF-8; without that flag MSVC reads them as
the system codepage and any non-ASCII character in a *string literal* reaches
the UI as mojibake.

**`ComboBoxAttachment` does not populate its box** — `ParamChoice` copies the
choices off the parameter itself. Forgetting this yields a silently empty menu.
