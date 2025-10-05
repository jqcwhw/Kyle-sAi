import { Source } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Download, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Calendar,
  Lock,
  Info
} from "lucide-react";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: Source;
}

export default function DocumentPreviewModal({ isOpen, onClose, source }: DocumentPreviewModalProps) {
  if (!source) return null;

  const getSourceIcon = (type: Source['type']) => {
    switch (type) {
      case 'cia':
      case 'fbi': 
      case 'nsa':
        return <Shield className="w-4 h-4 text-primary" />;
      default:
        return <ExternalLink className="w-4 h-4 text-primary" />;
    }
  };

  const getSourceLabel = (type: Source['type']) => {
    switch (type) {
      case 'cia': return 'CIA Reading Room';
      case 'fbi': return 'FBI Vault';
      case 'nara': return 'National Archives';
      case 'nsa': return 'NSA Declassified';
      case 'wayback': return 'Archive.org';
      case 'academic': return 'Academic Source';
      case 'doe': return 'DOE OpenNet';
      default: return 'Web Source';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0" data-testid="document-preview-modal">
        {/* Modal Header */}
        <DialogHeader className="p-6 border-b border-border">
          <div className="flex-1">
            <DialogTitle className="text-xl font-bold mb-1">
              {source.title}
            </DialogTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                {getSourceIcon(source.type)}
                {getSourceLabel(source.type)}
              </span>
              {source.documentDate && (
                <>
                  <span>•</span>
                  <span>{source.documentDate}</span>
                </>
              )}
              {source.declassifiedDate && (
                <>
                  <span>•</span>
                  <span>Declassified: {source.declassifiedDate}</span>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Document Viewer Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="bg-background/50 rounded-lg border border-border p-8">
            {source.type === 'wayback' ? (
              /* Wayback Machine Preview */
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Archived Web Page</h3>
                <p className="text-muted-foreground mb-4">{source.description}</p>
                <Button
                  onClick={() => window.open(source.url, '_blank')}
                  data-testid="button-view-archived-page"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Archived Page
                </Button>
              </div>
            ) : (
              /* Document Preview Placeholder */
              <>
                <div className="aspect-[8.5/11] bg-white rounded border shadow-lg mb-4 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h4 className="text-lg font-semibold mb-2">Declassified Document</h4>
                    <p className="text-sm">{source.title}</p>
                    {source.pages && (
                      <p className="text-xs mt-2">Document contains {source.pages} pages</p>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-muted/10 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-1">This is a preview of the declassified document.</p>
                      <p>Click "View Original" to access the full document from the official government archive.</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => window.open(source.url, '_blank')}
              data-testid="button-view-original"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Original
            </Button>
            {source.type !== 'wayback' && (
              <Button
                variant="outline"
                onClick={() => {
                  // In a real implementation, this would download the PDF
                  window.open(source.url, '_blank');
                }}
                data-testid="button-download-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
          
          {source.pages && source.type !== 'wayback' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-9 h-9 p-0"
                data-testid="button-previous-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Page 1 of {source.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="w-9 h-9 p-0"
                data-testid="button-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
