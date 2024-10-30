# Pixelflow Canvas

A virtual CRT for old school graphics programming in Visual Studio Code.

## Features

- 📺 Create a virtual screen to draw on!
- 🔍 Choose your own resolution!
- 🎨 Use RGB colors or use a palette!
- 🧟 `set_pixel` and `get_pixel` are back!

## Usage

1. Install the extension
2. Launch the CRT with `Ctrl+Shift+P` and `Show Pixelflow Canvas`
3. Talk to the canvas via TCP – use the protocol or use the provided Ruby library

## Protocol

By default, the canvas listens on `http://127.0.0.1:19223`. The default resolution is 320x180 pixels, full RGB color (24-bit).

To send a command, send raw bytes over the wire. The first byte is the command, followed by the arguments.

### Commands

- `set_size`: Resizes the canvas
  - `0x01` (u8)
  - `width` (u16)
  - `height` (u16)
- `set_color_mode`: Chooses between full color RGB and palette mode
  - `0x02` (u8)
  - `mode` (u8) – `0` for RGB, `1` for palette
- `set_palette`: Sets the RGB values for a given color (please note that the palette is limited to 256 colors and r, g, b values must be in the range 0-63)
  - `0x03` (u8)
  - `index` (u8)
  - `r` (u8)
  - `g` (u8)
  - `b` (u8)
- `set_advance`: Every time a pixel is set, the cursor advances by one pixel. This command allows you to choose whether the cursor should advance right or down.
  - `0x04` (u8)
  - `advance` (u8) – `0` for right, `1` for down
- `move_to`: Sets the cursor to a specific position (please note that x gets sent as u8 if the canvas width is less than 256 and as u16 otherwise, and the same goes for y)
  - `0x05` (u8)
  - `x` (u8 or u16)
  - `y` (u8 or u16)
- `set_pixel`: Sets a pixel to a specific color (depending on the color mode, the color is either a u8 index or a u24 RGB value)
  - `0x06` (u8)
  - `color` (u8 or u24)
- `set_buffer`: Blits an entire buffer to the screen (the buffer is a sequence of colors, depending on the color mode, the color is either a u8 index or a u24 RGB value)
  - `0x07` (u8)
  - `buffer` (u8 or u24) * width * height