import { useState, useCallback } from "react";
import { Scan, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import WebcamCapture from "@/components/WebcamCapture";
import EmotionResults, { type EmotionResult } from "@/components/EmotionResults";

const Index = () => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<EmotionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);

  const handleImageSelect = useCallback((base64: string, preview: string) => {
    setImageBase64(base64);
    setPreviewUrl(preview);
    setResult(null);
    setShowWebcam(false);
  }, []);

  const handleClear = useCallback(() => {
    setImageBase64(null);
    setPreviewUrl(null);
    setResult(null);
  }, []);

  const analyzeEmotion = useCallback(async () => {
    if (!imageBase64) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-emotion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64 }),
        }
      );

      if (resp.status === 429) {
        toast.error("Rate limit reached. Please wait a moment and try again.");
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted. Please add credits to continue.");
        return;
      }

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to analyze image");
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageBase64]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/[0.04] blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Brain className="w-4 h-4" />
            AI-Powered Analysis
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="gradient-text">Face Emotion</span>{" "}
            <span className="text-foreground">Detection</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-md mx-auto">
            Upload a photo and let AI analyze facial expressions with confidence scoring.
          </p>
        </header>

        {/* Upload area */}
        <section className="mb-8">
          {showWebcam ? (
            <WebcamCapture
              onCapture={handleImageSelect}
              onClose={() => setShowWebcam(false)}
            />
          ) : (
            <ImageUpload
              onImageSelect={handleImageSelect}
              previewUrl={previewUrl}
              onClear={handleClear}
              isAnalyzing={isAnalyzing}
              onOpenWebcam={() => setShowWebcam(true)}
            />
          )}
        </section>

        {/* Analyze Button */}
        {imageBase64 && !result && (
          <div className="flex justify-center mb-10 animate-fade-in">
            <button
              onClick={analyzeEmotion}
              disabled={isAnalyzing}
              className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isAnalyzing ? (
                <>
                  <Scan className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Detect Emotion
                </>
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <section>
            <EmotionResults result={result} />
          </section>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground animate-fade-in">
          Powered by Gemini Vision AI · Emotion analysis in seconds
        </footer>
      </div>
    </div>
  );
};

export default Index;
