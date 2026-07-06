"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";

export type SignaturePadHandle = {
  getDataUrl: () => string | null;
  clear: () => void;
};

export const SignaturePad = forwardRef<SignaturePadHandle>((_props, ref) => {
  const canvasRef = useRef<SignatureCanvas>(null);

  useImperativeHandle(ref, () => ({
    getDataUrl: () => {
      const canvas = canvasRef.current;
      if (!canvas || canvas.isEmpty()) return null;
      // getTrimmedCanvas() pulls in the `trim-canvas` package, which fails to bundle
      // correctly here ("trim_canvas is not a function") — toDataURL() skips it entirely.
      return canvas.toDataURL("image/png");
    },
    clear: () => canvasRef.current?.clear(),
  }));

  return (
    <div className="space-y-2">
      <div className="w-fit rounded-lg border border-input bg-white">
        <SignatureCanvas
          ref={canvasRef}
          penColor="black"
          canvasProps={{ width: 320, height: 140, className: "rounded-lg" }}
        />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => canvasRef.current?.clear()}>
        Clear
      </Button>
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";
