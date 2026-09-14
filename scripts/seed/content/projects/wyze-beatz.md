A website for the music I made under the name Wyze Beatz: hip-hop instrumentals, synthwave, and experimental work, with a dark cosmic look. Although I don't make music as much anymore, I still dabble from time to time and wanted my own platform for it.

## The technical bit

- WaveSurfer.js for waveform rendering and audio playback
- Canvas visualizers driven by the Web Audio API's `AnalyserNode`, with FFT bins mapped to particle positions, orbital radii, and color ramps
- All visual effects render in a single `requestAnimationFrame` loop, to keep frame timing consistent even with multiple effects running at once

## The design bit

Music sites usually treat the player as a utility widget under the track title. I wanted the player to *be* the design: the waveform and the visualizer together are the main visual on the page.
