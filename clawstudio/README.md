# ClawStudio
Browser-based modular performance studio. Original drum synthesis is packaged locally as WebAssembly; no fallback engine.
Source: https://github.com/sbrunwas/afterglow/tree/clawstudio-mono-dsp-clarity-v20

## Keyboard Jam

The studio starts in Edit mode. Click **Keyboard Jam** to play the selected instrument; click **Edit** or press **Esc** to type again. Held notes release when you leave Jam mode, change instruments/octaves, or leave the window. These keys perform live without changing pattern steps.

- **A W S E D F T G Y H U J K O L P ; '**: piano notes, with simultaneous notes on Poly and Texture.
- **A S D F G H J K L ; '**: drum lanes from Kick to Ride; **A S D F** gate the four sampler reels.
- **Z / X**: octave down/up; **1–6**: instrument; **Space**: play/pause; **M**: mute the selected instrument; **Shift**: accent.

Open **Key Map** for labeled pads that also work with a pointer. Browser Ctrl/Command shortcuts remain available.

## Drum sound and transitions

Fresh sessions use the neutral Afterglow drum settings, no drum sends, and a clean master. **Clean Afterglow Sound** restores this routing for an existing song while retaining its drum voices and patterns; it also bypasses master glitch FX and heat. Desk → **Master Sound** offers the previous **Glue** compression. Older projects retain their saved processing.

Auto Transition offers **4, 8 or 16 beats** with gentler recipes and an assignable stereo **Reverb** route. Wet Mix and Intensity control transition processing too. Release fades from the current macro value; reverb tails decay naturally. Older bar-based duration settings migrate to the equivalent beat count.

## Copy sequences between instruments

Each rack sequencer has **Copy Sequence From**, **Copy Sequence**, and **Undo Copy**. Choose another instrument to copy its currently selected step pattern into the current destination pattern. Length, notes, accents, slide/overlap, gate and repeats transfer; oscillator, filter, effect and mixer settings stay as they are. Notes retain their absolute pitch across different root settings. Poly chord steps use their lowest voiced note on Mono, Texture or Acid. Copying into Poly selects Step Sequencer playback; copying from Poly uses its step pattern rather than its arpeggiator performance.

The Drum Machine uses its selected lane: copies to synths turn its hits into root-note gates; copies into drums transfer rhythm, accents and repeats into the selected lane and set that pattern’s length. Nonstandard drum lengths such as 30 steps remain exact when copied to synths. Undo Copy restores the previous pattern and length. Loading a project or patch clears this copy history.
