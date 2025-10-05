import { Source } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Archive, 
  FileText, 
  History, 
  GraduationCap, 
  Database, 
  Globe, 
  X, 
  Download,
  Calendar,
  FolderOpen,
  Lock,
  Clock
} from "lucide-react";

interface SourcesPanelProps {
  sources: Source[];
  selectedSource?: Source;
  onSelectSource: (source: Source) => void;
  onClose: () => void;
  onPreviewDocument: (source: Source) => void;
}

export default function SourcesPanel({ 
  sources, 
  selectedSource, 
  onSelectSource, 
  onClose, 
  onPreviewDocument 
}: SourcesPanelProps) {
  const getSourceIcon = (type: Source['type']) => {
    switch (type) {
      case 'cia':
        return <Shield className="w-5 h-5 text-primary" />;
      case 'fbi':
        return <FileText className="w-5 h-5 text-accent" />;
      case 'nara':
        return <Archive className="w-5 h-5 text-secondary" />;
      case 'nsa':
        return <Shield className="w-5 h-5 text-primary" />;
      case 'wayback':
        return <History className="w-5 h-5 text-muted-foreground" />;
      case 'academic':
        return <GraduationCap className="w-5 h-5 text-primary" />;
      case 'doe':
        return <Database className="w-5 h-5 text-secondary" />;
      default:
        return <Globe className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getSourceLabel = (type: Source['type']) => {
    switch (type) {
      case 'cia': return 'CIA';
      case 'fbi': return 'FBI Vault';
      case 'nara': return 'NARA';
      case 'nsa': return 'NSA';
      case 'wayback': return 'Archive.org';
      case 'academic': return 'Academic';
      case 'doe': return 'DOE OpenNet';
      default: return 'Web';
    }
  };

  const getSourceColor = (type: Source['type']) => {
    switch (type) {
      case 'cia': return 'primary';
      case 'fbi': return 'accent';
      case 'nara': return 'secondary';
      case 'nsa': return 'primary';
      case 'wayback': return 'muted';
      case 'academic': return 'primary';
      case 'doe': return 'secondary';
      default: return 'muted';
    }
  };

  return (
    <aside className="w-full md:w-80 border-l border-border bg-card overflow-hidden flex flex-col" data-testid="sources-panel">
      {/* Panel Header */}
      <div className="p-3 md:p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Sources & Documents</h3>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={onClose}
            data-testid="button-close-sources"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            data-testid="button-sources-tab"
          >
            Sources ({sources.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            data-testid="button-preview-tab"
          >
            Preview
          </Button>
        </div>
      </div>

      {/* Sources List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {sources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sources found</p>
              <p className="text-xs mt-1">Try asking a research question</p>
            </div>
          ) : (
            sources.map((source, index) => {
              const isSelected = selectedSource?.id === source.id;
              const color = getSourceColor(source.type);

              return (
                <div
                  key={source.id}
                  className={`source-card p-4 bg-background rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? `border-${color} bg-${color}/5` 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onSelectSource(source)}
                  data-testid={`source-card-${index}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${color}/20 flex items-center justify-center flex-shrink-0`}>
                      {getSourceIcon(source.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-secondary">[{index + 1}]</span>
                        <span className={`px-2 py-0.5 bg-${color}/10 border border-${color}/30 rounded text-xs text-${color}`}>
                          {getSourceLabel(source.type)}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
                        {source.title}
                      </h4>
                      {source.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {source.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {source.documentDate && (
                          <>
                            <Calendar className="w-3 h-3" />
                            <span>{source.documentDate}</span>
                          </>
                        )}
                        {source.declassifiedDate && (
                          <>
                            <span>•</span>
                            <Lock className="w-3 h-3" />
                            <span>Declassified {source.declassifiedDate}</span>
                          </>
                        )}
                        {source.pages && (
                          <>
                            <span>•</span>
                            <span>{source.pages} pages</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewDocument(source);
                        }}
                        data-testid="button-preview-document"
                      >
                        Preview Document
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Actions Footer */}
      {sources.length > 0 && (
        <div className="p-4 border-t border-border">
          <Button
            className="w-full"
            data-testid="button-export-sources"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All Sources
          </Button>
        </div>
      )}
    </aside>
  );
}