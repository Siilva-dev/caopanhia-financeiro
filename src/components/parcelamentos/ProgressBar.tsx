import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ProgressBarProps {
  initialValue?: number;
  onProgressChange?: (value: number) => void;
  disabled?: boolean;
}

export function ProgressBar({ 
  initialValue = 0, 
  onProgressChange,
  disabled = false 
}: ProgressBarProps) {
  const [progress, setProgress] = useState([initialValue]);

  const handleProgressChange = (value: number[]) => {
    setProgress(value);
    onProgressChange?.(value[0]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Progresso do Parcelamento</Label>
        <span className="text-sm text-muted-foreground">{progress[0]}%</span>
      </div>
      
      <Slider
        value={progress}
        onValueChange={handleProgressChange}
        max={100}
        step={1}
        disabled={disabled}
        className="w-full"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}