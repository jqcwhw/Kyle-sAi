import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "./sidebar";
import SourcesPanel from "./sources-panel";
import MessageBubble from "./message-bubble";
import DocumentPreviewModal from "./document-preview-modal";
import SettingsModal from "./settings-modal";
import { useChat } from "@/hooks/use-chat";
import { useSources } from "@/hooks/use-sources";
import { Search, Paperclip, Send, Settings, Menu } from "lucide-react";

interface ChatInterfaceProps {
  conversationId?: string;
}

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSourcesPanelOpen, setIsSourcesPanelOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>(['cia', 'fbi', 'nara', 'nsa', 'wayback', 'web']);
  const [maxSources, setMaxSources] = useState(20);
  const [archiveYears, setArchiveYears] = useState(25);
  const [selectedModel, setSelectedModel] = useState('groq-llama');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    sendMessage,
    currentConversationId
  } = useChat(conversationId);

  const {
    selectedSource,
    selectSource,
    isDocumentPreviewOpen,
    setIsDocumentPreviewOpen,
    previewDocument
  } = useSources();

  const handleSubmit = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");

    // Auto-resize textarea back to original size
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessage(userMessage, {
      sources: selectedSourceTypes,
      maxSources,
      archiveYears,
      selectedModel
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  const fillExampleQuery = (query: string) => {
    setMessage(query);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const currentSources = messages.length > 0 ? messages[messages.length - 1]?.sources || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative min-h-screen flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={() => window.location.href = '/'}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-card/50 backdrop-blur-lg border-b border-border p-3 md:p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              data-testid="button-open-sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold glow-text truncate">Deep Archive AI</h1>
              <p className="text-xs text-muted-foreground">Truth Seeker v2.0</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Source Filter Toggles */}
            <div className="hidden md:flex items-center gap-2 mr-4">
              {[
                { key: 'cia', label: 'Declassified', icon: '🛡️' },
                { key: 'wayback', label: 'Archives', icon: '📚' },
                { key: 'web', label: 'Web', icon: '🌐' }
              ].map(({ key, label, icon }) => (
                <Button
                  key={key}
                  variant={selectedSourceTypes.some(s =>
                    key === 'cia' ? ['cia', 'fbi', 'nara', 'nsa'].includes(s) :
                    key === 'wayback' ? s === 'wayback' :
                    s === 'web'
                  ) ? "default" : "secondary"}
                  size="sm"
                  onClick={() => {
                    if (key === 'cia') {
                      const declassifiedSources = ['cia', 'fbi', 'nara', 'nsa'];
                      const hasAny = selectedSourceTypes.some(s => declassifiedSources.includes(s));
                      if (hasAny) {
                        setSelectedSourceTypes(prev => prev.filter(s => !declassifiedSources.includes(s)));
                      } else {
                        setSelectedSourceTypes(prev => [...prev, ...declassifiedSources]);
                      }
                    } else {
                      const isSelected = selectedSourceTypes.includes(key);
                      if (isSelected) {
                        setSelectedSourceTypes(prev => prev.filter(s => s !== key));
                      } else {
                        setSelectedSourceTypes(prev => [...prev, key]);
                      }
                    }
                  }}
                  className="text-xs"
                  data-testid={`button-toggle-${key}`}
                >
                  <span className="mr-1">{icon}</span>
                  {label}
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              data-testid="button-settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Chat & Sources Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
              {messages.length === 0 ? (
                /* Welcome Message */
                <div className="max-w-3xl mx-auto text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
                    <Search className="text-white w-8 h-8" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold mb-3 glow-text">Welcome to Deep Archive AI</h3>
                  <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                    Your cosmic truth seeker powered by advanced AI. Ask me anything and I'll search through declassified documents, historical archives, and the depths of the internet to uncover the truth.
                  </p>

                  {/* Example Queries */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {[
                      {
                        query: "Search declassified CIA documents about Operation Paperclip",
                        description: "FOIA archives & classified materials",
                        icon: "📄"
                      },
                      {
                        query: "Find archived versions of deleted government pages about UFO investigations",
                        description: "Wayback Machine & historical web",
                        icon: "🕰️"
                      },
                      {
                        query: "Research government documents on MKUltra mind control experiments",
                        description: "FBI Vault, NSA, National Archives",
                        icon: "🏛️"
                      },
                      {
                        query: "Deep dive into historical events surrounding the JFK assassination",
                        description: "Primary sources & academic papers",
                        icon: "📖"
                      }
                    ].map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="text-left p-4 h-auto flex items-start gap-3 hover:border-primary/50 hover:bg-muted/10"
                        onClick={() => fillExampleQuery(example.query)}
                        data-testid={`button-example-${index}`}
                      >
                        <span className="text-lg mt-1">{example.icon}</span>
                        <div className="text-left">
                          <p className="text-sm font-medium">{example.query}</p>
                          <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Messages */
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      onCitationClick={(sourceId) => {
                        const source = currentSources.find(s => s.id === sourceId);
                        if (source) {
                          selectSource(source);
                          setIsSourcesPanelOpen(true);
                        }
                      }}
                      onBookmark={() => {
                        // TODO: Implement bookmark functionality
                      }}
                    />
                  ))}
                  {isLoading && (
                    <div className="flex items-start gap-4 message-bubble">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Search className="text-white w-5 h-5 animate-spin" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                              <span className="text-primary font-medium">Searching archives...</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted/20 rounded animate-pulse"></div>
                            <div className="h-4 bg-muted/20 rounded animate-pulse w-3/4"></div>
                            <div className="h-4 bg-muted/20 rounded animate-pulse w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border bg-card/50 backdrop-blur-lg p-4">
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Ask me to search declassified documents, historical archives, or dive deep into any topic..."
                    value={message}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-24 text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary scrollbar-thin min-h-[60px]"
                    rows={2}
                    data-testid="textarea-message"
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0"
                      data-testid="button-attach-file"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="w-8 h-8 p-0 bg-gradient-to-r from-primary to-accent"
                      onClick={handleSubmit}
                      disabled={!message.trim() || isLoading}
                      data-testid="button-send"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span>🛡️</span>
                      Using: DeepSeek R1 + Multi-Source Search
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Shift + Enter for new line
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sources Panel */}
          {isSourcesPanelOpen && (
            <SourcesPanel
              sources={currentSources}
              selectedSource={selectedSource}
              onSelectSource={selectSource}
              onClose={() => setIsSourcesPanelOpen(false)}
              onPreviewDocument={previewDocument}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <DocumentPreviewModal
        isOpen={isDocumentPreviewOpen}
        onClose={() => setIsDocumentPreviewOpen(false)}
        source={selectedSource}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedSources={selectedSourceTypes}
        onSourcesChange={setSelectedSourceTypes}
        maxSources={maxSources}
        onMaxSourcesChange={setMaxSources}
        archiveYears={archiveYears}
        onArchiveYearsChange={setArchiveYears}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}