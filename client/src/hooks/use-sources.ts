import { useState } from "react";
import type { Source } from "@shared/schema";

export function useSources() {
  const [selectedSource, setSelectedSource] = useState<Source | undefined>();
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false);

  const selectSource = (source: Source) => {
    setSelectedSource(source);
  };

  const previewDocument = (source: Source) => {
    setSelectedSource(source);
    setIsDocumentPreviewOpen(true);
  };

  const clearSelection = () => {
    setSelectedSource(undefined);
    setIsDocumentPreviewOpen(false);
  };

  return {
    selectedSource,
    selectSource,
    isDocumentPreviewOpen,
    setIsDocumentPreviewOpen,
    previewDocument,
    clearSelection,
  };
}
