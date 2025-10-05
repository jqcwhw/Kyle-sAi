import { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { User, Search, Bookmark, Share } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  onCitationClick: (sourceId: string) => void;
  onBookmark: () => void;
}

export default function MessageBubble({ message, onCitationClick, onBookmark }: MessageBubbleProps) {
  const isUser = message.role === "user";
  
  // Parse citations from message content
  const parseContentWithCitations = (content: string) => {
    const citationRegex = /\[(\d+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(content)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }
      
      // Add citation
      parts.push({
        type: 'citation',
        content: match[1],
        sourceId: message.sources?.[parseInt(match[1]) - 1]?.id
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const contentParts = parseContentWithCitations(message.content);
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isUser) {
    return (
      <div className="flex items-start gap-4 message-bubble" data-testid="message-user">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
          <User className="text-white w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="bg-muted/20 rounded-2xl rounded-tl-sm p-4">
            <p className="text-foreground">{message.content}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2 ml-1">
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 message-bubble" data-testid="message-assistant">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
        <Search className="text-white w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-5">
          <div className="prose prose-invert max-w-none">
            <div className="text-foreground leading-relaxed space-y-4">
              {contentParts.map((part, index) => (
                <span key={index}>
                  {part.type === 'text' ? (
                    part.content.split('\n').map((line, lineIndex) => (
                      <span key={lineIndex}>
                        {line}
                        {lineIndex < part.content.split('\n').length - 1 && <br />}
                      </span>
                    ))
                  ) : (
                    <button
                      className="citation-badge"
                      onClick={() => part.sourceId && onCitationClick(part.sourceId)}
                      data-testid={`citation-${part.content}`}
                    >
                      [{part.content}]
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Source Summary */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-secondary" />
                <span className="text-sm font-semibold text-foreground">Sources Found</span>
                <span className="text-xs text-muted-foreground">
                  ({message.sources.length} documents)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(message.sources.map(s => s.type))).map(type => {
                  const typeInfo = {
                    cia: { label: 'CIA FOIA', color: 'primary' },
                    fbi: { label: 'FBI Vault', color: 'accent' },
                    nara: { label: 'National Archives', color: 'secondary' },
                    nsa: { label: 'NSA', color: 'primary' },
                    wayback: { label: 'Archive.org', color: 'muted' },
                    web: { label: 'Web Search', color: 'muted' },
                    academic: { label: 'Academic', color: 'secondary' },
                    doe: { label: 'DOE OpenNet', color: 'secondary' }
                  }[type] || { label: type, color: 'muted' };

                  const count = message.sources!.filter(s => s.type === type).length;
                  
                  return (
                    <span
                      key={type}
                      className={`px-2 py-1 bg-${typeInfo.color}/10 border border-${typeInfo.color}/30 rounded text-xs text-${typeInfo.color}`}
                      data-testid={`source-tag-${type}`}
                    >
                      {typeInfo.label} ({count})
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-2 ml-1">
          <p className="text-xs text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-primary h-auto p-0"
            onClick={onBookmark}
            data-testid="button-bookmark"
          >
            <Bookmark className="w-3 h-3 mr-1" />
            Bookmark
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-primary h-auto p-0"
            data-testid="button-share"
          >
            <Share className="w-3 h-3 mr-1" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
