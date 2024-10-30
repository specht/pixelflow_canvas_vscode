import * as vscode from 'vscode';
import * as http from 'http';
import * as net from 'net';
import { Base64 } from 'js-base64';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {

    var panel: vscode.WebviewPanel | null = null;
    var crt_width = 320;
    var crt_height = 180;
    var color_mode = 0;

    var outgoing_queue: any[] = [];

    const disposable = vscode.commands.registerCommand('pixelflow_canvas.launch', () => {
        panel = vscode.window.createWebviewPanel(
            'crtCanvasWebview',
            'Pixelflow Canvas',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
            }
        );
        panel.webview.onDidReceiveMessage(
            message => {
                console.log(`extension received message: `, message);
                outgoing_queue.push(message);
            },
            undefined,
            context.subscriptions
        )
        setHtmlContent(panel.webview, context);
    });

    context.subscriptions.push(disposable);

    const queue: number[] = [];
    let offset = 0;
    let flush_outgoing_queue = false;

    // const process_queue = () => {
    function process_queue() {
        flush_outgoing_queue = false;
        if (offset >= queue.length) { return; }
        let messages = [];
        while (true) {
            if (offset >= queue.length) { break; }
            const command = queue[offset];
            if (command === 1 && queue.length >= offset + 5) {
                // SET_SIZE
                const width = queue[offset + 1] * 256 + queue[offset + 2];
                const height = queue[offset + 3] * 256 + queue[offset + 4];
                crt_width = width;
                crt_height = height;
                messages.push({ command: 'set_size', width: width, height: height });
                offset += 5;
            } else if (command === 2 && queue.length >= offset + 2) {
                // SET_COLOR_MODE
                color_mode = queue[offset + 1];
                messages.push({ command: 'set_color_mode', mode: color_mode });
                offset += 2;
            } else if (command === 3 && queue.length >= offset + 5) {
                // SET_PALETTE
                messages.push({ command: 'set_palette', i: queue[offset + 1], r: queue[offset + 2], g: queue[offset + 3], b: queue[offset + 4] });
                offset += 5;
            } else if (command === 4 && queue.length >= offset + 2) {
                // SET_ADVANCE_MODE
                messages.push({ command: 'set_advance_mode', mode: queue[offset + 1] });
                offset += 2;
            } else if (command === 5 && queue.length >= offset + 1 + (crt_width <= 256 ? 1 : 2) + (crt_height <= 256 ? 1 : 2)) {
                // MOVE_TO
                offset += 1;
                let x = queue[offset++];
                if (crt_width > 256) { x = x * 256 + queue[offset++]; }
                let y = queue[offset++];
                if (crt_height > 256) { y = y * 256 + queue[offset++]; }
                messages.push({ command: 'move_to', x: x, y: y });
            } else if (command === 6 && queue.length >= offset + 1 + (color_mode === 0 ? 3 : 1)) {
                // SET_PIXEL
                messages.push({ command: 'set_pixel', color: queue.slice(offset + 1, offset + 1 + (color_mode === 0 ? 3 : 1)) });
                offset += 1 + (color_mode === 0 ? 3 : 1);
            } else if (command === 7 && queue.length >= offset + 1 + crt_width * crt_height * (color_mode === 0 ? 3 : 1)) {
                // SET_BUFFER
                messages.push({ command: 'set_buffer', buffer: queue.slice(offset + 1, offset + 1 + crt_width * crt_height * (color_mode === 0 ? 3 : 1)) });
                offset += 1 + crt_width * crt_height * (color_mode === 0 ? 3 : 1);
            } else if (command === 8 && queue.length >= offset + 2) {
                // SET_INTERPOLATION_MODE
                messages.push({ command: 'set_interpolation_mode', mode: queue[offset + 1] });
                offset += 2;
            } else if (command === 9 && queue.length >= offset + 1) {
                messages.push({ command: 'collect_events' });
                flush_outgoing_queue = true;
                offset += 1;
            } else {
                break;
            }
        }
        queue.splice(0, offset);
        offset = 0;
        if (panel !== null) {
            panel.webview.postMessage(messages);
        }
    }

    const server = net.createServer({noDelay: true, keepAlive: true}, (socket) => {
        console.log('Connection opened');
        queue.splice(0, queue.length);
        offset = 0;
        if (panel !== null) {
            panel.webview.postMessage([{ command: 'reset' }]);
            panel.webview.postMessage([{ command: 'set_size', width: 320, height: 180 }]);
            panel.webview.postMessage([{ command: 'set_color_mode', mode: 0 }]);
            panel.webview.postMessage([{ command: 'set_interpolation_mode', mode: 0 }]);
            panel.webview.postMessage([{ command: 'set_advance_mode', mode: 0 }]);
            outgoing_queue.splice(0, outgoing_queue.length);
        }

        socket.on('end', () => {
            console.log('Connection closed');
            queue.splice(0, queue.length);
            offset = 0;
        });

        socket.on('data', (data) => {
            queue.push(...data);
            process_queue();
            if (flush_outgoing_queue) {
                const json = JSON.stringify(outgoing_queue) + "\r\n";
                socket.write(Buffer.from(json));
                outgoing_queue.splice(0, outgoing_queue.length);
            }
        });
    });

    server.listen(19223, '127.0.0.1', () => {
        console.log('Server started');
    });
}

function setHtmlContent(webview: vscode.Webview, extensionContext: vscode.ExtensionContext) {
    let htmlContent = `<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="pixelstream.css" rel="stylesheet">
        <style>
        #space {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
        }
        #canvasSection {
            width: 100%;
            height: 100%;
            position: absolute;
            display: flex;
        }
        #pixelstream_canvas {
            /* image-rendering: pixelated; */
            /* border: 10px solid #333; */
            /* border-radius: 10px; */
            /* margin-top: 10px; */
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        /*
        #canvasSection::before {
            content: " ";
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            z-index: 2;
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
        }
        */
      </style>
      <script>
      </script>
    </head>
    <body>
      <div id="space"><div id="canvasSection"><canvas width='320' height='180' id="pixelstream_canvas" style="image-rendering: pixelated;" /></div></div>
      <script type="text/javascript" src="pixelstream.js"></script>
    </body>
  </html>`;
    const jsFilePath = vscode.Uri.joinPath(extensionContext.extensionUri, 'javascript', 'pixelstream.js');
    const visUri = webview.asWebviewUri(jsFilePath);
    htmlContent = htmlContent.replace('pixelstream.js', visUri.toString());

    webview.html = htmlContent;
}

export function deactivate() {}
