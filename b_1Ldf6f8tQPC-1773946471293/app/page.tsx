"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const MAX_IMAGE_SIZE = 512;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
        if (width > height) {
          height = (height / width) * MAX_IMAGE_SIZE;
          width = MAX_IMAGE_SIZE;
        } else {
          width = (width / height) * MAX_IMAGE_SIZE;
          height = MAX_IMAGE_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      resolve(dataUrl);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function FaceSwapPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setSelectedImage(file);
        const resized = await resizeImage(file);
        setImagePreview(resized);
        setError(null);
      } catch {
        setError("Failed to process image");
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!selectedImage || !name.trim()) {
      setError("Please upload an image and enter a name");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);
    setStatus("Starting face swap...");

    try {
      // ✅ FIX: FORM DATA CORRETTO
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("name", name.trim());
      formData.append("posterKey", "pulp"); // temporaneo

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setResultImage(data.result);
      setStatus(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setName("");
    setResultImage(null);
    setError(null);
    setStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Face Swap Generator
        </h1>

        <div className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-neutral-400">Your Photo</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-neutral-700 rounded-lg p-4 cursor-pointer hover:border-neutral-500 transition-colors bg-neutral-900"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-contain rounded"
                />
              ) : (
                <div className="h-48 flex items-center justify-center text-neutral-500">
                  Click to upload an image
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-neutral-400">Your Name</label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isLoading || !selectedImage || !name.trim()}
            className="w-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                {status || "Processing..."}
              </span>
            ) : (
              "Generate"
            )}
          </Button>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        {resultImage && (
          <div className="w-full flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white text-center">
              Your Movie Poster
            </h2>
            <div className="border border-neutral-700 rounded-lg overflow-hidden">
              <img
                src={resultImage}
                alt="Generated movie poster"
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1 border-neutral-700 text-white hover:bg-neutral-800"
              >
                Start Over
              </Button>
              <Button
                asChild
                className="flex-1 bg-white text-black hover:bg-neutral-200"
              >
                <a href={resultImage} download="movie-poster.jpg" target="_blank">
                  Download
                </a>
              </Button>
            </div>
          </div>
        )}

        {!resultImage && (
          <div className="w-full flex flex-col gap-2">
            <p className="text-xs text-neutral-500 text-center">
              Your face will be swapped onto this poster
            </p>
            <div className="border border-neutral-800 rounded-lg overflow-hidden opacity-60">
              <img
                src="/movie-poster.jpg"
                alt="Base movie poster"
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}