"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Dancing_Script } from "next/font/google";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 400 is the lightest weight Dancing Script ships (Google Fonts has no 200/300 cut
// for cursive scripts) — at TYPED_FONT_SIZE it still reads as a light, thin stroke.
const signatureFont = Dancing_Script({ subsets: ["latin"], weight: "400" });

export type SignaturePadHandle = {
  getDataUrl: () => Promise<string | null>;
  clear: () => void;
};

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 140;
const TRIM_PADDING = 10;
const TYPED_FONT_SIZE = 16;

/**
 * Crops a canvas down to the bounding box of its non-transparent pixels so the
 * exported signature is tightly framed instead of sitting small in a mostly-blank
 * box. react-signature-canvas's own getTrimmedCanvas() pulls in the `trim-canvas`
 * package, which fails to bundle here ("trim_canvas is not a function"), so this
 * does the same crop manually via getImageData.
 */
const trimCanvas = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = source.getContext("2d");
  if (!ctx) return source;

  const { width, height } = source;
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return source;

  minX = Math.max(0, minX - TRIM_PADDING);
  minY = Math.max(0, minY - TRIM_PADDING);
  maxX = Math.min(width - 1, maxX + TRIM_PADDING);
  maxY = Math.min(height - 1, maxY + TRIM_PADDING);

  const trimmed = document.createElement("canvas");
  trimmed.width = maxX - minX + 1;
  trimmed.height = maxY - minY + 1;
  trimmed
    .getContext("2d")!
    .drawImage(source, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  return trimmed;
};

const renderTypedSignature = async (text: string): Promise<HTMLCanvasElement> => {
  // Rendered at a higher resolution than the on-screen preview so the exported PNG
  // stays crisp once pdf-lib scales it into the (usually larger) signature slot.
  const font = `400 ${TYPED_FONT_SIZE * 3}px ${signatureFont.style.fontFamily}`;
  await document.fonts.load(font);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH * 2;
  canvas.height = CANVAS_HEIGHT * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.trim(), canvas.width / 2, canvas.height / 2);
  return canvas;
};

type Mode = "draw" | "type";

export const SignaturePad = forwardRef<SignaturePadHandle>((_props, ref) => {
  const canvasRef = useRef<SignatureCanvas>(null);
  const [mode, setMode] = useState<Mode>("draw");
  const [typedName, setTypedName] = useState("");

  const clear = () => {
    canvasRef.current?.clear();
    setTypedName("");
  };

  useImperativeHandle(ref, () => ({
    getDataUrl: async () => {
      if (mode === "type") {
        if (!typedName.trim()) return null;
        const canvas = await renderTypedSignature(typedName);
        return trimCanvas(canvas).toDataURL("image/png");
      }

      const canvas = canvasRef.current;
      if (!canvas || canvas.isEmpty()) return null;
      return trimCanvas(canvas.getCanvas()).toDataURL("image/png");
    },
    clear,
  }));

  return (
    <div className="space-y-2">
      <div className="inline-flex gap-1 rounded-lg border border-input p-0.5">
        <Button type="button" variant={mode === "draw" ? "default" : "ghost"} size="sm" onClick={() => setMode("draw")}>
          Draw
        </Button>
        <Button type="button" variant={mode === "type" ? "default" : "ghost"} size="sm" onClick={() => setMode("type")}>
          Type
        </Button>
      </div>

      {mode === "draw" ? (
        <div className="w-fit rounded-lg border border-input bg-white">
          <SignatureCanvas
            ref={canvasRef}
            penColor="black"
            minWidth={0.5}
            maxWidth={1.5}
            canvasProps={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, className: "rounded-lg" }}
          />
        </div>
      ) : (
        <div
          className="flex items-center rounded-lg border border-input bg-white px-4"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          <input
            value={typedName}
            onChange={(event) => setTypedName(event.target.value)}
            placeholder="Type your name"
            style={{ fontSize: TYPED_FONT_SIZE }}
            className={cn(
              "w-full bg-transparent text-center text-black outline-none placeholder:text-muted-foreground",
              signatureFont.className,
            )}
          />
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={clear}>
        Clear
      </Button>
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";
