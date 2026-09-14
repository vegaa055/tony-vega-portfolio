Astral Vega is a wavetable synthesizer inspired by Serum, built as a VST3 plugin and a standalone app with C++ and JUCE 8. I made it for synthwave and hip-hop sound design, and built it one milestone at a time, from a basic polyphonic synth with a single oscillator up to a full custom interface.

Its wavetable code and effects later carried over into [Vision Quest](/projects/vision-quest), a much larger multi-engine synth.

## The wavetable engine

A wavetable is a stack of single-cycle waveforms, called frames, that the oscillator can morph between. Astral Vega builds its factory tables from spectral recipes: each frame is described as a set of harmonics, then turned into a waveform with an inverse FFT.

The hard part of wavetables is *aliasing*. A bright waveform played at a high note contains harmonics above the Nyquist limit, and those fold back down as harsh, out-of-tune noise. The fix is to store every frame at 11 "mipmap" levels, each keeping fewer harmonics than the last, then pick the brightest level that's still safe for the note being played:

```cpp
int Wavetable::mipForPhaseInc (float phaseIncrement) const noexcept
{
    if (phaseIncrement <= 0.0f)
        return 0;

    const int allowedHarmonics = (int) (0.5f / phaseIncrement);

    for (int mip = 0; mip < numMips; ++mip)
        if (topHarmonicForMip (mip) <= allowedHarmonics)
            return mip;

    return numMips - 1;
}
```

You can also load your own tables. Astral Vega imports Serum-format `.wav` files (2048-sample frames, up to 256 of them), runs a forward FFT on each frame, and builds the same band-limited mipmap chain. The new table reaches the audio thread through a lock-free handoff, so loading one never interrupts playback.

## What's in it

- **Two wavetable oscillators** with independent tables, positions, and tuning, each with up to 7-voice unison, detune, and stereo spread, plus a sub oscillator and a noise source.
- **Modulation:** two LFOs with five shapes, a second envelope, and a 6-slot modulation matrix. You can create a routing by dragging a modulation source onto a knob.
- **Tempo sync** for the LFOs, the delay, and the pump effect, following the host's tempo.
- **A morphing filter** that sweeps continuously from low-pass through band-pass to high-pass, with drive and key tracking.
- **Effects:** distortion, bitcrusher, phaser, chorus, delay, and reverb, plus a sidechain-style pump on the master bus.
- **Voice modes:** poly, mono, and legato, with glide and an adjustable pitch-bend range.
- **Presets:** 10 factory presets, plus your own saved as XML.

## A custom interface

The last milestone replaced JUCE's default look with a synthwave theme: glowing neon knobs, LED toggles, and titled panels. An oscilloscope and a spectrum analyzer read audio from the synth through a lock-free queue, so drawing them never slows down the sound. Each oscillator's wavetable display shows the current frame over ghosted frames from across the table, with a cursor that follows the modulated position as it moves.

I make music in FL Studio, so I also added a QWERTY typing keyboard with FL Studio's key layout and octave naming. The standalone app plays just like the DAW I already know.
