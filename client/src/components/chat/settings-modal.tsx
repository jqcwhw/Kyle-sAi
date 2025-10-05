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

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
  maxSources: number;
  onMaxSourcesChange: (value: number) => void;
  archiveYears: number;
  onArchiveYearsChange: (value: number) => void;
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
}: SettingsModalProps) {
  const [localSources, setLocalSources] = useState(selectedSources);
  const [localMaxSources, setLocalMaxSources] = useState(maxSources);
  const [localArchiveYears, setLocalArchiveYears] = useState(archiveYears);
  const [selectedModel, setSelectedModel] = useState('deepseek-r1');

  const handleSave = () => {
    onSourcesChange(localSources);
    onMaxSourcesChange(localMaxSources);
    onArchiveYearsChange(localArchiveYears);
    onClose();
  };

  const handleCancel = () => {
    setLocalSources(selectedSources);
    setLocalMaxSources(maxSources);
    setLocalArchiveYears(archiveYears);
    onClose();
  };

  const toggleSource = (source: string) => {
    setLocalSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const aiModels = [
    {
      id: 'deepseek-r1',
      name: 'DeepSeek R1 32B',
      description: 'Best reasoning, free via HuggingFace',
      recommended: true
    },
    {
      id: 'qwen-72b',
      name: 'Qwen 2.5 72B',
      description: 'Multilingual, strong research capabilities'
    },
    {
      id: 'llama-70b',
      name: 'Llama 3.3 70B',
      description: 'General purpose, reliable performance'
    }
  ];

  const searchSources = [
    { id: 'cia', name: 'CIA FOIA Reading Room' },
    { id: 'fbi', name: 'FBI Vault' },
    { id: 'nara', name: 'National Archives (NARA)' },
    { id: 'nsa', name: 'NSA Declassified Materials' },
    { id: 'wayback', name: 'Internet Archive / Wayback Machine' },
    { id: 'web', name: 'General Web Search' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[80vh] flex flex-col p-0" data-testid="settings-modal">
        {/* Modal Header */}
        <DialogHeader className="p-6 border-b border-border">
          <DialogTitle className="text-xl font-bold">Research Settings</DialogTitle>
        </DialogHeader>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
          {/* AI Model Selection */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">AI Model</h4>
            <div className="space-y-2">
              {aiModels.map((model) => (
                <Label
                  key={model.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedModel === model.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:bg-muted/10'
                  }`}
                  data-testid={`model-option-${model.id}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="model"
                      checked={selectedModel === model.id}
                      onChange={() => setSelectedModel(model.id)}
                      className="w-4 h-4 text-primary"
                    />
                    <div>
                      <p className="font-medium text-foreground">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    </div>
                  </div>
                  {model.recommended && (
                    <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                      Recommended
                    </span>
                  )}
                </Label>
              ))}
            </div>
          </div>

          {/* Search Sources */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Search Sources</h4>
            <div className="space-y-2">
              {searchSources.map((source) => (
                <Label
                  key={source.id}
                  className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/10 transition-colors"
                  data-testid={`source-option-${source.id}`}
                >
                  <Checkbox
                    checked={localSources.includes(source.id)}
                    onCheckedChange={() => toggleSource(source.id)}
                    className="mr-3"
                  />
                  <span className="text-sm">{source.name}</span>
                </Label>
              ))}
            </div>
          </div>

          {/* Search Depth */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Search Depth</h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm text-muted-foreground">
                    Maximum sources to retrieve
                  </Label>
                  <span className="text-sm font-medium text-foreground">
                    {localMaxSources}
                  </span>
                </div>
                <Slider
                  value={[localMaxSources]}
                  onValueChange={(values) => setLocalMaxSources(values[0])}
                  min={5}
                  max={50}
                  step={1}
                  className="w-full"
                  data-testid="slider-max-sources"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm text-muted-foreground">
                    Archive search years back
                  </Label>
                  <span className="text-sm font-medium text-foreground">
                    {localArchiveYears}
                  </span>
                </div>
                <Slider
                  value={[localArchiveYears]}
                  onValueChange={(values) => setLocalArchiveYears(values[0])}
                  min={5}
                  max={75}
                  step={1}
                  className="w-full"
                  data-testid="slider-archive-years"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-border flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="button-cancel-settings"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            data-testid="button-save-settings"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
