import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
  maxSources: number;
  onMaxSourcesChange: (max: number) => void;
  archiveYears: number;
  onArchiveYearsChange: (years: number) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  selectedSources,
  onSourcesChange,
  maxSources,
  onMaxSourcesChange,
  archiveYears,
  onArchiveYearsChange,
  selectedModel,
  onModelChange,
}: SettingsModalProps) {
  const sourceTypes = [
    { id: 'cia', label: 'CIA FOIA', description: 'CIA declassified documents' },
    { id: 'fbi', label: 'FBI Vault', description: 'FBI investigative files' },
    { id: 'nara', label: 'National Archives', description: 'Historical government records' },
    { id: 'nsa', label: 'NSA', description: 'NSA declassified materials' },
    { id: 'wayback', label: 'Wayback Machine', description: 'Archived web pages' },
    { id: 'web', label: 'Web Search', description: 'Current web results' },
  ];

  const models = [
    { id: 'groq-llama', label: 'Llama 3.3 70B (Groq)' },
    { id: 'openrouter-deepseek', label: 'DeepSeek R1 (OpenRouter)' },
    { id: 'huggingface-qwen', label: 'Qwen 2.5 7B (HuggingFace)' },
  ];

  const handleSourceToggle = (sourceId: string, checked: boolean) => {
    if (checked) {
      onSourcesChange([...selectedSources, sourceId]);
    } else {
      onSourcesChange(selectedSources.filter(id => id !== sourceId));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Search Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Model Selection */}
          <div className="space-y-2">
            <Label>AI Model</Label>
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                {models.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source Types */}
          <div className="space-y-3">
            <Label>Source Types</Label>
            <div className="grid grid-cols-1 gap-3">
              {sourceTypes.map(source => (
                <div key={source.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={source.id}
                    checked={selectedSources.includes(source.id)}
                    onCheckedChange={(checked) => handleSourceToggle(source.id, !!checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor={source.id} className="text-sm font-medium">
                      {source.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {source.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Max Sources */}
          <div className="space-y-3">
            <Label>Maximum Sources: {maxSources}</Label>
            <Slider
              value={[maxSources]}
              onValueChange={(value) => onMaxSourcesChange(value[0])}
              max={50}
              min={5}
              step={5}
              className="w-full"
            />
          </div>

          {/* Archive Years */}
          <div className="space-y-3">
            <Label>Archive Years Back: {archiveYears}</Label>
            <Slider
              value={[archiveYears]}
              onValueChange={(value) => onArchiveYearsChange(value[0])}
              max={75}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}