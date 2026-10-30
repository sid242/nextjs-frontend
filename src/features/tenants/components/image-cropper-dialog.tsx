"use client";

import { useRef, useState, type PointerEvent } from "react";
import { Crop, Loader2, Maximize2, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type CropAssetType = "logo" | "logo-dark" | "favicon" | "cover";

export interface CropPreset {
  id: string;
  label: string;
  aspectRatio: number; // width / height, e.g. 1, 4/1, 16/9
  idealWidth: number;
  idealHeight: number;
}

const PRESETS_BY_TYPE: Record<CropAssetType, CropPreset[]> = {
  logo: [
    { id: "4-1", label: "4:1 Horizontal", aspectRatio: 4 / 1, idealWidth: 800, idealHeight: 200 },
    { id: "1-1", label: "1:1 Square", aspectRatio: 1, idealWidth: 512, idealHeight: 512 },
    { id: "3-1", label: "3:1 Banner", aspectRatio: 3 / 1, idealWidth: 600, idealHeight: 200 },
  ],
  "logo-dark": [
    { id: "4-1", label: "4:1 Horizontal", aspectRatio: 4 / 1, idealWidth: 800, idealHeight: 200 },
    { id: "1-1", label: "1:1 Square", aspectRatio: 1, idealWidth: 512, idealHeight: 512 },
    { id: "3-1", label: "3:1 Banner", aspectRatio: 3 / 1, idealWidth: 600, idealHeight: 200 },
  ],
  favicon: [{ id: "1-1", label: "1:1 Favicon", aspectRatio: 1, idealWidth: 128, idealHeight: 128 }],
  cover: [
    {
      id: "16-9",
      label: "16:9 Standard Hero",
      aspectRatio: 16 / 9,
      idealWidth: 1920,
      idealHeight: 1080,
    },
    {
      id: "21-9",
      label: "21:9 Ultrawide",
      aspectRatio: 21 / 9,
      idealWidth: 2560,
      idealHeight: 1080,
    },
    { id: "4-3", label: "4:3 Classic", aspectRatio: 4 / 3, idealWidth: 1600, idealHeight: 1200 },
  ],
};

interface ImageCropperBodyProps {
  imageSrc: string;
  fileName: string;
  assetType: CropAssetType;
  onCropComplete: (croppedFile: File) => Promise<void>;
  onCancel: () => void;
}

function ImageCropperBody({
  imageSrc,
  fileName,
  assetType,
  onCropComplete,
  onCancel,
}: ImageCropperBodyProps) {
  const presets = PRESETS_BY_TYPE[assetType] ?? PRESETS_BY_TYPE.logo;
  const [selectedPreset, setSelectedPreset] = useState<CropPreset>(presets[0]!);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleApplyCrop = async () => {
    if (!imageRef.current || !containerRef.current || !imageSrc) return;

    setIsProcessing(true);
    try {
      const img = imageRef.current;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();

      // Viewport crop box dimensions inside container
      const targetAspect = selectedPreset.aspectRatio;
      let cropWidth = containerRect.width * 0.85;
      let cropHeight = cropWidth / targetAspect;

      if (cropHeight > containerRect.height * 0.85) {
        cropHeight = containerRect.height * 0.85;
        cropWidth = cropHeight * targetAspect;
      }

      const cropLeft = (containerRect.width - cropWidth) / 2;
      const cropTop = (containerRect.height - cropHeight) / 2;

      // Offscreen canvas setup
      const canvas = document.createElement("canvas");
      canvas.width = selectedPreset.idealWidth;
      canvas.height = selectedPreset.idealHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Unable to obtain 2D canvas context");
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Clear with transparent background (preserve PNG/WebP alpha)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Compute relative image transform
      const imgRect = img.getBoundingClientRect();

      // Scale factors between container display and output canvas
      const scaleToCanvas = canvas.width / cropWidth;

      // Transformation matrix mapping screen coords to canvas coords
      ctx.save();
      ctx.translate(
        (imgRect.left - containerRect.left - cropLeft) * scaleToCanvas +
          (imgRect.width / 2) * scaleToCanvas,
        (imgRect.top - containerRect.top - cropTop) * scaleToCanvas +
          (imgRect.height / 2) * scaleToCanvas,
      );
      ctx.rotate((rotation * Math.PI) / 180);

      const renderWidth = imgRect.width * scaleToCanvas;
      const renderHeight = imgRect.height * scaleToCanvas;

      ctx.drawImage(img, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);
      ctx.restore();

      // Convert canvas to blob / file
      const outputType =
        assetType === "favicon"
          ? "image/png"
          : fileName.endsWith(".webp")
            ? "image/webp"
            : fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
              ? "image/jpeg"
              : "image/png";

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), outputType, 0.95),
      );

      if (!blob) {
        throw new Error("Failed to export cropped image");
      }

      const croppedFile = new File([blob], fileName, { type: outputType });
      await onCropComplete(croppedFile);
    } catch {
      // error handled upstream
    } finally {
      setIsProcessing(false);
    }
  };

  const getTitle = () => {
    switch (assetType) {
      case "logo":
        return "Crop Light Mode Logo";
      case "logo-dark":
        return "Crop Dark Mode Logo";
      case "favicon":
        return "Crop Browser Favicon";
      case "cover":
        return "Crop Auth Hero Cover";
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Crop className="text-primary size-4" /> {getTitle()}
          </DialogTitle>
          <Badge variant="outline" className="font-mono text-[10px]">
            {selectedPreset.idealWidth} × {selectedPreset.idealHeight} px
          </Badge>
        </div>
        <DialogDescription className="text-xs">
          Adjust position, zoom, and aspect ratio guide to ensure pixel-perfect rendering across
          devices.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Aspect Ratio Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium">Aspect Guide:</span>
          {presets?.map((preset) => (
            <Button
              key={preset.id}
              variant={selectedPreset.id === preset.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedPreset(preset);
                setPan({ x: 0, y: 0 });
              }}
              className="h-7 text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Interactive Crop Viewport */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="border-border/80 relative flex h-[340px] w-full cursor-grab items-center justify-center overflow-hidden rounded-lg border bg-zinc-950 select-none active:cursor-grabbing"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Source preview for cropping"
            draggable={false}
            className="pointer-events-none max-h-[85%] max-w-[85%] object-contain transition-transform duration-75"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            }}
          />

          {/* Visual Crop Overlay & Rule-of-Thirds Grid */}
          <div
            className="pointer-events-none absolute border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
            style={{
              aspectRatio: `${selectedPreset.aspectRatio}`,
              width: selectedPreset.aspectRatio >= 1 ? "85%" : "auto",
              height: selectedPreset.aspectRatio < 1 ? "85%" : "auto",
              maxHeight: "85%",
              maxWidth: "85%",
            }}
          >
            {/* Rule of thirds lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>
          </div>

          {/* Corner Alignment Indicators */}
          <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-[10px] text-white/80 backdrop-blur">
            <Maximize2 className="size-3" />
            <span>Drag to re-center • Scroll/slider to zoom</span>
          </div>
        </div>

        {/* Transformation Controls Bar */}
        <div className="border-border/50 bg-muted/20 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-2.5">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2">
            <ZoomOut className="text-muted-foreground size-4" />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="bg-border accent-primary h-1.5 w-32 cursor-pointer appearance-none rounded-lg sm:w-44"
            />
            <ZoomIn className="text-muted-foreground size-4" />
            <span className="text-muted-foreground w-10 font-mono text-xs">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotation & Reset Actions */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="h-8 gap-1.5 text-xs"
            >
              <RotateCw className="size-3.5" /> Rotate 90°
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground h-8 text-xs"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button type="button" onClick={handleApplyCrop} disabled={isProcessing} className="gap-2">
          {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Crop className="size-4" />}
          Apply & Upload
        </Button>
      </DialogFooter>
    </>
  );
}

export interface ImageCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  fileName: string;
  assetType: CropAssetType;
  onCropComplete: (croppedFile: File) => Promise<void>;
}

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  fileName,
  assetType,
  onCropComplete,
}: ImageCropperDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        {open && imageSrc ? (
          <ImageCropperBody
            key={`${assetType}-${fileName}`}
            imageSrc={imageSrc}
            fileName={fileName}
            assetType={assetType}
            onCropComplete={async (file) => {
              await onCropComplete(file);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
