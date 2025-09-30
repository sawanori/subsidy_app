'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle, AlertCircle, Info } from 'lucide-react';

/**
 * DraftGenerationUI - IHUI�������
 *
 * RAG���nIH����LW2W�h:
 */

interface DraftGenerationUIProps {
  projectId: string;
  schemeId: string;
  onDraftGenerated: (draftId: string) => void;
}

interface GenerationStatus {
  stage: 'idle' | 'fetching_template' | 'building_prompt' | 'generating' | 'parsing' | 'complete' | 'error';
  message: string;
  progress: number;
}

export const DraftGenerationUI: React.FC<DraftGenerationUIProps> = ({
  projectId,
  schemeId,
  onDraftGenerated,
}) => {
  const [status, setStatus] = useState<GenerationStatus>({
    stage: 'idle',
    message: '',
    progress: 0,
  });
  const [draftData, setDraftData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setStatus({ stage: 'fetching_template', message: '������֗-...', progress: 20 });

    try {
      // Simulate stages for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStatus({ stage: 'building_prompt', message: '�������-...', progress: 40 });

      await new Promise((resolve) => setTimeout(resolve, 500));
      setStatus({ stage: 'generating', message: 'AIIH-...', progress: 60 });

      // Actual API call
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, schemeId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'IHk1WW~W_');
      }

      const draft = await response.json();

      setStatus({ stage: 'parsing', message: '������-...', progress: 80 });
      await new Promise((resolve) => setTimeout(resolve, 500));

      setStatus({ stage: 'complete', message: 'IH��', progress: 100 });
      setDraftData(draft);
      onDraftGenerated(draft.id);
    } catch (err: any) {
      setStatus({ stage: 'error', message: err.message, progress: 0 });
      setError(err.message);
    }
  };

  const getStageIcon = () => {
    switch (status.stage) {
      case 'complete':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'idle':
        return <Sparkles className="h-6 w-6 text-blue-500" />;
      default:
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
    }
  };

  const isGenerating =
    status.stage !== 'idle' && status.stage !== 'complete' && status.stage !== 'error';

  return (
    <Card>
      <CardHeader>
        <CardTitle>AIIH</CardTitle>
        <CardDescription>
          RAGRetrieval-Augmented Generation	g3��IH���W~Y
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </Alert>
        )}

        {/* Generation Status */}
        {status.stage !== 'idle' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {getStageIcon()}
              <div className="flex-1">
                <p className="font-medium">{status.message}</p>
                <Progress value={status.progress} className="h-2 mt-2" />
              </div>
              {status.stage === 'complete' && (
                <Badge variant="default" className="bg-green-500">
                  ��
                </Badge>
              )}
            </div>

            {/* Stage Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {[
                { stage: 'fetching_template', label: '������' },
                { stage: 'building_prompt', label: '�����' },
                { stage: 'generating', label: 'AI' },
                { stage: 'parsing', label: '�' },
              ].map((item) => {
                const isActive = status.stage === item.stage;
                const isDone =
                  ['fetching_template', 'building_prompt', 'generating', 'parsing'].indexOf(
                    status.stage,
                  ) >
                  ['fetching_template', 'building_prompt', 'generating', 'parsing'].indexOf(
                    item.stage,
                  );

                return (
                  <div
                    key={item.stage}
                    className={`p-3 rounded-lg border ${
                      isActive
                        ? 'border-blue-500 bg-blue-50'
                        : isDone || status.stage === 'complete'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        isActive
                          ? 'text-blue-700'
                          : isDone || status.stage === 'complete'
                            ? 'text-green-700'
                            : 'text-gray-400'
                      }`}
                    >
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Draft Preview */}
        {draftData && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-semibold mb-3">P�</h4>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Hj�</dt>
                <dd className="font-medium">v{draftData.version}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">�B</dt>
                <dd className="font-medium">
                  {new Date(draftData.createdAt).toLocaleString('ja-JP')}
                </dd>
              </div>
              {draftData.metadata && (
                <>
                  <div>
                    <dt className="text-muted-foreground">(���</dt>
                    <dd className="font-medium">{draftData.metadata.model}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">����p</dt>
                    <dd className="font-medium">
                      {draftData.metadata.tokensUsed?.total?.toLocaleString() || 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">�����</dt>
                    <dd className="font-medium">�{draftData.metadata.estimatedCost || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">B�</dt>
                    <dd className="font-medium">
                      {draftData.metadata.duration
                        ? `${(draftData.metadata.duration / 1000).toFixed(1)}�`
                        : 'N/A'}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>
        )}

        {/* Info */}
        {status.stage === 'idle' && (
          <Alert>
            <Info className="h-4 w-4" />
            <div>
              <p className="font-medium">AIIHkdDf</p>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>" 6�������h�����1�q</li>
                <li>" OpenAI gpt-4o-minig���jIH�</li>
                <li>" B�: 1030�</li>
                <li>" �����: �0.050.20/�</li>
              </ul>
            </div>
          </Alert>
        )}

        {/* Generate Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || status.stage === 'complete'}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                -...
              </>
            ) : status.stage === 'complete' ? (
              ''
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                IH��
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};