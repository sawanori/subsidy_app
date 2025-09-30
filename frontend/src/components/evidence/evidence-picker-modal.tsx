'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Search,
  CheckSquare,
  Square,
  Hash,
  AlertCircle,
  Sparkles,
  Copy,
} from 'lucide-react';

/**
 * エビデンスピッカーモーダル
 * APP-420: 段落別の引用チェック
 */

interface Evidence {
  id: string;
  title: string;
  url: string;
  content?: string;
  status: 'pending' | 'fetching' | 'ingested' | 'failed';
}

interface Citation {
  id: string;
  text: string;
  pageNumber?: number;
  confidence?: number;
}

interface Paragraph {
  id: string;
  text: string;
  pageNumber?: number;
  lineNumber?: number;
  isHeader?: boolean;
  level?: number;
  confidence?: number;
  selected?: boolean;
}

interface EvidencePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: Evidence;
  onCitationsSelect: (citations: Citation[]) => void;
}

export function EvidencePickerModal({
  isOpen,
  onClose,
  evidence,
  onCitationsSelect,
}: EvidencePickerModalProps) {
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [selectedParagraphs, setSelectedParagraphs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  /**
   * コンテンツを段落に分割
   */
  useEffect(() => {
    if (evidence.content) {
      const parsed = parseContentToParagraphs(evidence.content);
      setParagraphs(parsed);
    }
  }, [evidence.content]);

  /**
   * 段落パース処理
   */
  const parseContentToParagraphs = (content: string): Paragraph[] => {
    const lines = content.split(/\n\n+/);
    const paragraphList: Paragraph[] = [];
    let currentPage = 1;
    let currentLine = 1;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // ヘッダー判定
      const isHeader = /^#{1,6}\s/.test(trimmed) || /^[一二三四五六七八九十]+[\.\、]/.test(trimmed);
      const level = isHeader ? (trimmed.match(/^#{1,6}/)?.[0].length || 1) : 0;

      // ページ区切り判定
      if (trimmed.includes('---Page') || trimmed.includes('ページ')) {
        currentPage++;
        currentLine = 1;
        return;
      }

      paragraphList.push({
        id: `para-${index}-${Date.now()}`,
        text: trimmed.replace(/^#{1,6}\s/, ''),
        pageNumber: currentPage,
        lineNumber: currentLine,
        isHeader,
        level,
        confidence: 0.95, // デフォルト信頼度
        selected: false,
      });

      currentLine += trimmed.split('\n').length;
    });

    return paragraphList;
  };

  /**
   * 段落選択トグル
   */
  const toggleParagraph = (paragraphId: string) => {
    setSelectedParagraphs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(paragraphId)) {
        newSet.delete(paragraphId);
      } else {
        newSet.add(paragraphId);
      }
      return newSet;
    });
  };

  /**
   * 全選択/全解除
   */
  const toggleAll = () => {
    if (selectedParagraphs.size === filteredParagraphs.length) {
      setSelectedParagraphs(new Set());
    } else {
      setSelectedParagraphs(new Set(filteredParagraphs.map((p) => p.id)));
    }
  };

  /**
   * AI提案による自動選択
   */
  const applyAISuggestions = async () => {
    setIsProcessing(true);
    try {
      // AIが重要な段落を提案（実際はAPIコール）
      const suggestions = paragraphs
        .filter((p) => {
          // 数値データ、金額、パーセンテージを含む段落を優先
          const hasNumbers = /\d+[万億円%]/.test(p.text);
          // 重要キーワードを含む段落
          const hasKeywords = /成長|増加|減少|課題|問題|解決|効果|実績/.test(p.text);
          // ヘッダー直後の段落
          const isImportantPosition = p.isHeader || p.lineNumber === 1;

          return hasNumbers || hasKeywords || isImportantPosition;
        })
        .slice(0, 10) // 上位10段落
        .map((p) => p.id);

      setSelectedParagraphs(new Set(suggestions));
      setAiSuggestions(suggestions);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 選択確定
   */
  const handleConfirm = () => {
    const citations: Citation[] = paragraphs
      .filter((p) => selectedParagraphs.has(p.id))
      .map((p) => ({
        id: p.id,
        text: p.text,
        pageNumber: p.pageNumber,
        confidence: p.confidence,
      }));

    onCitationsSelect(citations);
    onClose();
  };

  /**
   * 検索フィルタリング
   */
  const filteredParagraphs = paragraphs.filter((p) =>
    p.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * 選択状態の統計
   */
  const getSelectionStats = () => {
    const selected = paragraphs.filter((p) => selectedParagraphs.has(p.id));
    const totalChars = selected.reduce((sum, p) => sum + p.text.length, 0);
    const pages = new Set(selected.map((p) => p.pageNumber)).size;

    return {
      count: selected.length,
      chars: totalChars,
      pages,
    };
  };

  const stats = getSelectionStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            引用箇所を選択
          </DialogTitle>
          <DialogDescription>
            {evidence.title} から引用する段落を選択してください
          </DialogDescription>
        </DialogHeader>

        {/* 検索とアクション */}
        <div className="flex gap-2 py-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="段落を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="gap-2"
          >
            {selectedParagraphs.size === filteredParagraphs.length ? (
              <>
                <Square className="h-4 w-4" />
                全解除
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4" />
                全選択
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={applyAISuggestions}
            disabled={isProcessing}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            AI提案
          </Button>
        </div>

        {/* 選択状態 */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{stats.count} 段落選択</span>
          <span>{stats.chars} 文字</span>
          <span>{stats.pages} ページ</span>
          {aiSuggestions.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI提案適用中
            </Badge>
          )}
        </div>

        {/* 段落リスト */}
        <ScrollArea className="flex-1 border rounded-lg p-4">
          <div className="space-y-2">
            {filteredParagraphs.length > 0 ? (
              filteredParagraphs.map((paragraph) => (
                <div
                  key={paragraph.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                    selectedParagraphs.has(paragraph.id) ? 'bg-muted' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedParagraphs.has(paragraph.id)}
                    onCheckedChange={() => toggleParagraph(paragraph.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start gap-2">
                      {paragraph.isHeader && (
                        <Badge variant="outline" className="text-xs">
                          H{paragraph.level}
                        </Badge>
                      )}
                      <p className={`text-sm ${paragraph.isHeader ? 'font-medium' : ''}`}>
                        {paragraph.text}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {paragraph.pageNumber && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          ページ {paragraph.pageNumber}
                        </span>
                      )}
                      {paragraph.lineNumber && (
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          行 {paragraph.lineNumber}
                        </span>
                      )}
                      {paragraph.confidence && (
                        <Badge
                          variant={
                            paragraph.confidence >= 0.9
                              ? 'default'
                              : paragraph.confidence >= 0.7
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {Math.round(paragraph.confidence * 100)}%
                        </Badge>
                      )}
                      {aiSuggestions.includes(paragraph.id) && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI推奨
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(paragraph.text)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">段落が見つかりません</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 処理中インジケータ */}
        {isProcessing && (
          <div className="py-2">
            <Progress value={50} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">AI提案を生成中...</p>
          </div>
        )}

        {/* 警告 */}
        {stats.count > 20 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              多数の段落が選択されています。重要な箇所に絞ることをお勧めします。
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedParagraphs.size === 0}
            className="gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            {stats.count > 0 ? `${stats.count}件を引用` : '引用箇所を選択'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}