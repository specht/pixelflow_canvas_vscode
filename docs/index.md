---
title: Getting started
layout: home
---

# Pixelflow Canvas (VS Code Extension)

A virtual CRT for old school graphics programming in Visual Studio Code.

{: .info }
This is the documentation for the [»Pixelflow Canvas«](https://marketplace.visualstudio.com/items?itemName=gymnasiumsteglitz.pixelflow-canvas) Visual Studio Code extension. Use the [pixelflow_canvas rubygem](https://github.com/specht/pixelflow_canvas_ruby) to interact with the canvas from Ruby.


## Getting started

1. Install the extension
2. Launch the CRT with `Ctrl+Shift+P` (or `F1`) and `Show Pixelflow Canvas`
3. Talk to the canvas via TCP – use the protocol or use the provided Ruby library

By default, the canvas listens on `http://127.0.0.1:19223`. The default resolution is 320x180 pixels, full RGB color (24-bit).

### TCP Commands

To send a command, send raw bytes over the wire. The first byte is the command, followed by the arguments.

<style>
    th { text-align: left; }
    td { vertical-align: top; }
</style>

<table>
<tr>
<th>Name</th>
<th>Bytes</th>
<th>Description</th>
</tr>
<tr>
<td><code>set_size</code></td>
<td><code>01 ww ww hh hh</code></td>
<td>Resizes the canvas to the given width and height</td>
</tr>
<tr>
<td><code>set_color_mode</code></td>
<td><code>02 mm</code></td>
<td>Chooses between full color RGB (0) and palette mode (1)</td>
</tr>
<tr>
<td><code>set_palette</code></td>
<td><code>03 ii rr gg bb</code></td>
<td>Sets the RGB values for a given color</td>
</tr>
<tr>
<td><code>set_advance</code></td>
<td><code>04 aa</code></td>
<td>Chooses whether the cursor should advance right (0) or down (1)</td>
</tr>
<tr>
<td><code>move_to</code></td>
<td><code>05 xx xx yy yy</code><br>
<code>05 xx yy yy</code><br>
<code>05 xx xx yy</code><br>
<code>05 xx yy</code><br>
</td>
<td>Sets the cursor to a specific position (encoding of x and y depends on resolution)</td>
</tr>
<tr>
<td><code>set_pixel</code></td>
<td><code>06 cc</code><br>
<code>06 rr gg bb</code>
</td>
<td>Sets the pixel at the current position to a specific color (encoding of color depends on color mode)</td>
</tr>
<tr>
<td><code>set_buffer</code></td>
<td><code>07 cc cc ... cc</code><br>
<code>07 rr gg bb rr gg bb ... rr gg bb</code>
</td>
<td>Blits an entire buffer to the screen (encoding of colors depends on color mode)</td>
</tr>
<tr>
<td><code>set_interpolation_mode</code></td>
<td><code>08 mm</code>
</td>
<td>Chooses between nearest neighbor (0) and bilinear interpolation (1)</td>
</tr>
<tr>
<td><code>fetch_events</code></td>
<td><code>09</code></td>
<td>Fetches all events from the event queue</td>
</tr>

</table>


