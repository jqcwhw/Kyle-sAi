import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Plus, 
  Clock, 
  Bookmark, 
  Settings, 
  X,
  Trash2
} from "lucide-react";
import type { Conversation, Bookmark as BookmarkType, SearchHistoryItem } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ isOpen, onClose, onNewChat, onOpenSettings }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'bookmarks'>('history');

  // Fetch conversations/search history
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  const { data: searchHistory = [] } = useQuery<SearchHistoryItem[]>({
    queryKey: ['/api/search-history'],
  });

  const { data: bookmarks = [] } = useQuery<BookmarkType[]>({
    queryKey: ['/api/bookmarks'],
  });

  const formatTimestamp = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return "Yesterday";
    return d.toLocaleDateString();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:flex'}
        ${isOpen ? 'flex' : 'hidden lg:flex'}
      `} data-testid="sidebar">

        {/* Logo & Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Search className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold glow-text">Deep Archive AI</h1>
                <p className="text-xs text-muted-foreground">Truth Seeker v2.0</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden w-8 h-8 p-0"
              onClick={onClose}
              data-testid="button-close-sidebar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* New Research Button */}
        <div className="p-4">
          <Button
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            data-testid="button-new-research"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Research
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pb-4">
          <div className="flex gap-1">
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab('history')}
              data-testid="button-history-tab"
            >
              <Clock className="w-4 h-4 mr-1" />
              History
            </Button>
            <Button
              variant={activeTab === 'bookmarks' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab('bookmarks')}
              data-testid="button-bookmarks-tab"
            >
              <Bookmark className="w-4 h-4 mr-1" />
              Saved
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1 px-4">
          {activeTab === 'history' ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Recent Searches
              </h3>

              {conversations.length === 0 && searchHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No search history yet</p>
                  <p className="text-xs mt-1">Start a conversation to see your history</p>
                </div>
              ) : (
                <>
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="group p-3 rounded-lg hover:bg-muted/10 cursor-pointer transition-colors"
                      onClick={() => {
                        window.location.href = `/chat/${conversation.id}`;
                        onClose();
                      }}
                      data-testid={`conversation-${conversation.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {conversation.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimestamp(conversation.updatedAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 p-0 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement delete conversation
                          }}
                          data-testid={`button-delete-conversation-${conversation.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {searchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="group p-3 rounded-lg hover:bg-muted/10 cursor-pointer transition-colors"
                      data-testid={`search-history-${item.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {item.query}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimestamp(item.timestamp)}
                            {item.resultsCount && ` • ${item.resultsCount} results`}
                          </p>
                        </div>
                        <Clock className="w-4 h-4 text-muted-foreground text-xs mt-1" />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Bookmarked Discoveries
              </h3>

              {bookmarks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No bookmarks yet</p>
                  <p className="text-xs mt-1">Bookmark important findings to save them</p>
                </div>
              ) : (
                bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="group p-3 rounded-lg hover:bg-muted/10 cursor-pointer transition-colors border border-border/50"
                    onClick={() => window.open(bookmark.url, '_blank')}
                    data-testid={`bookmark-${bookmark.id}`}
                  >
                    <div className="flex items-start gap-2">
                      <Bookmark className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {bookmark.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {bookmark.sourceType.toUpperCase()}
                          </span>
                          {bookmark.pages && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{bookmark.pages} pages</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>

        {/* Settings Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={onOpenSettings}
            data-testid="button-sidebar-settings"
          >
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Button>
        </div>
      </aside>
    </>
  );
}