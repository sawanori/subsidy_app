'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Plus,
  ExternalLink,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Globe,
  Calendar,
  Hash,
  Sparkles,
} from 'lucide-react';
import { EvidencePickerModal } from './evidence-picker-modal';
import { apiClient } from '@/lib/api/client';

/**
 * エビデンスセクション
 * APP-419: 検索→選択→/fetch→/ingest
 */

interface Evidence {
  id: string;
  title: string;
  url: string;
  snippet: string;
  content?: string;
  source: string;
  publishedDate?: string;
  fetchedDate?: string;
  status: 'pending' | 'fetching' | 'ingested' | 'failed';
  embedding?: number[];
  citations?: Citation[];
}

interface Citation {
  id: string;
  text: string;
  pageNumber?: number;
  confidence?: number;
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string;
}

interface EvidenceSectionProps {
  applicationId: string;
  onEvidenceUpdate?: (evidence: Evidence[]) => void;
}

export function EvidenceSection({
  applicationId,
  onEvidenceUpdate,
}: EvidenceSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [fetchProgress, setFetchProgress] = useState<Record<string, number>>({});

  /**
   * 検索実行
   */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await apiClient.post('/research/search', {
        query: searchQuery,
        limit: 10,
        locale: 'ja-JP',
      });

      const results: SearchResult[] = response.items.map((item: any) => ({
        id: `search-${Date.now()}-${Math.random()}`,
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        source: item.source || 'web',
        publishedDate: item.datePublished,
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * エビデンス追加
   */
  const addEvidence = async (result: SearchResult) => {
    const evidence: Evidence = {
      ...result,
      status: 'pending',
      fetchedDate: new Date().toISOString(),
    };

    setEvidences((prev) => [...prev, evidence]);
    
    // コンテンツ取得開始
    await fetchContent(evidence);
  };

  /**
   * コンテンツ取得
   */
  const fetchContent = async (evidence: Evidence) => {
    setFetchProgress((prev) => ({ ...prev, [evidence.id]: 10 }));
    
    try {
      // コンテンツ取得
      setFetchProgress((prev) => ({ ...prev, [evidence.id]: 30 }));
      const fetchResponse = await apiClient.post('/research/fetch', {
        url: evidence.url,
      });

      // エンベディング生成
      setFetchProgress((prev) => ({ ...prev, [evidence.id]: 60 }));
      const ingestResponse = await apiClient.post('/research/ingest', {
        evidence_id: evidence.id,
        content: fetchResponse.content,
        metadata: {
          title: evidence.title,
          url: evidence.url,
          source: evidence.source,
        },
      });

      setFetchProgress((prev) => ({ ...prev, [evidence.id]: 100 }));

      // ステータス更新
      setEvidences((prev) =>
        prev.map((e) =>
          e.id === evidence.id
            ? {
                ...e,
                status: 'ingested',
                content: fetchResponse.content,
                embedding: ingestResponse.embedding,
              }
            : e
        )
      );

      // 進捗クリア
      setTimeout(() => {
        setFetchProgress((prev) => {
          const { [evidence.id]: _, ...rest } = prev;
          return rest;
        });
      }, 1000);
    } catch (error) {
      console.error('Fetch failed:', error);
      setEvidences((prev) =>
        prev.map((e) =>
          e.id === evidence.id ? { ...e, status: 'failed' } : e
        )
      );
      setFetchProgress((prev) => {
        const { [evidence.id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  /**
   * エビデンス削除
   */
  const removeEvidence = (id: string) => {
    setEvidences((prev) => prev.filter((e) => e.id !== id));
  };

  /**
   * AI提案
   */
  const handleAISuggestion = async () => {
    setIsSearching(true);
    try {
      // AIが関連キーワードを提案
      const suggestions = [
        '補助金 中小企業 デジタル化',
        '事業再構築補助金 申請要件',
        'IT導入補助金 2024',
      ];

      // 複数検索を実行
      for (const query of suggestions) {
        setSearchQuery(query);
        await handleSearch();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusIcon = (status: Evidence['status']) => {
    switch (status) {
      case 'pending':
        return <Hash className="h-4 w-4 text-muted-foreground" />;
      case 'fetching':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'ingested':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            エビデンス管理
          </CardTitle>
          <CardDescription>
            補助金申請の根拠となる資料を検索・収集します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 検索バー */}
          <div className="flex gap-2">
            <Input
              placeholder="検索キーワードを入力"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="gap-2"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              検索
            </Button>
            <Button
              variant="outline"
              onClick={handleAISuggestion}
              disabled={isSearching}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI提案
            </Button>
          </div>

          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">検索結果</h3>
                <Badge variant="secondary">{searchResults.length}件</Badge>
              </div>
              <ScrollArea className="h-48 border rounded-lg p-3">
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-start justify-between p-2 hover:bg-muted rounded"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {result.title}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {result.snippet}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {new URL(result.url).hostname}
                              </a>
                              {result.publishedDate && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(result.publishedDate).toLocaleDateString('ja-JP')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addEvidence(result)}
                        disabled={evidences.some((e) => e.url === result.url)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* 収集済みエビデンス */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">収集済みエビデンス</h3>
              <Badge>{evidences.length}件</Badge>
            </div>
            
            {evidences.length > 0 ? (
              <div className="space-y-2">
                {evidences.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(evidence.status)}
                          <span className="font-medium text-sm">
                            {evidence.title}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {evidence.url}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {evidence.status === 'ingested' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEvidence(evidence);
                              setShowPickerModal(true);
                            }}
                          >
                            引用選択
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEvidence(evidence.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 進捗バー */}
                    {fetchProgress[evidence.id] !== undefined && (
                      <Progress value={fetchProgress[evidence.id]} className="h-2" />
                    )}

                    {/* 引用数 */}
                    {evidence.citations && evidence.citations.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {evidence.citations.length} 引用
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  エビデンスがありません。検索して追加してください。
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 引用選択モーダル */}
      {selectedEvidence && (
        <EvidencePickerModal
          isOpen={showPickerModal}
          onClose={() => {
            setShowPickerModal(false);
            setSelectedEvidence(null);
          }}
          evidence={selectedEvidence}
          onCitationsSelect={(citations) => {
            // 引用を更新
            setEvidences((prev) =>
              prev.map((e) =>
                e.id === selectedEvidence.id
                  ? { ...e, citations }
                  : e
              )
            );
            onEvidenceUpdate?.(evidences);
          }}
        />
      )}
    </>
  );
}