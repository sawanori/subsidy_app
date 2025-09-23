'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { PreviewProvider } from '@/contexts/PreviewContext';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePreview } from '@/contexts/PreviewContext';

function PreviewDemoForm() {
  const { formData, updateFormData, isFormValid, hasUnsavedChanges } = usePreview();
  const t = useTranslations();

  const handleInputChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
      {/* 左ペイン：入力フォーム */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>補助金申請フォーム</CardTitle>
          <CardDescription>
            入力内容がリアルタイムで右側のプレビューに反映されます
          </CardDescription>
          {hasUnsavedChanges && (
            <div className="text-xs text-orange-600">
              変更が検出されました - プレビュー更新中...
            </div>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto space-y-6">
          {/* 基本情報 */}
          <section>
            <h3 className="text-lg font-semibold mb-4">基本情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">法人・団体名 *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="株式会社サンプル"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="representativeName">代表者氏名 *</Label>
                <Input
                  id="representativeName"
                  value={formData.representativeName}
                  onChange={(e) => handleInputChange('representativeName', e.target.value)}
                  placeholder="山田 太郎"
                />
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="address">所在地 *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="東京都千代田区丸の内1-1-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号 *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="03-1234-5678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="info@example.com"
                />
              </div>
            </div>
          </section>

          {/* 事業内容 */}
          <section>
            <h3 className="text-lg font-semibold mb-4">事業内容</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectTitle">事業名 *</Label>
                <Input
                  id="projectTitle"
                  value={formData.projectTitle}
                  onChange={(e) => handleInputChange('projectTitle', e.target.value)}
                  placeholder="AI技術活用による業務効率化システム開発事業"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectDescription">事業内容 *</Label>
                <Textarea
                  id="projectDescription"
                  value={formData.projectDescription}
                  onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                  placeholder="人工知能技術を活用した業務効率化システムの開発を行います..."
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">開始日 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.projectPeriod.startDate}
                    onChange={(e) => handleInputChange('projectPeriod', {
                      ...formData.projectPeriod,
                      startDate: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">終了日 *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.projectPeriod.endDate}
                    onChange={(e) => handleInputChange('projectPeriod', {
                      ...formData.projectPeriod,
                      endDate: e.target.value
                    })}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 申請金額 */}
          <section>
            <h3 className="text-lg font-semibold mb-4">申請金額</h3>
            <div className="space-y-2">
              <Label htmlFor="requestAmount">補助金申請額 * (円)</Label>
              <Input
                id="requestAmount"
                type="number"
                value={formData.requestAmount || ''}
                onChange={(e) => handleInputChange('requestAmount', parseInt(e.target.value) || 0)}
                placeholder="10000000"
                min="0"
                step="100000"
              />
              <p className="text-xs text-gray-500">
                事業費総額の80%以内で入力してください
              </p>
            </div>
          </section>

          {/* 詳細情報 */}
          <section>
            <h3 className="text-lg font-semibold mb-4">詳細情報（任意）</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessPlan">事業計画詳細</Label>
                <Textarea
                  id="businessPlan"
                  value={formData.businessPlan || ''}
                  onChange={(e) => handleInputChange('businessPlan', e.target.value)}
                  placeholder="事業の背景、目的、市場分析等を記載..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="technologyDescription">技術内容</Label>
                <Textarea
                  id="technologyDescription"
                  value={formData.technologyDescription || ''}
                  onChange={(e) => handleInputChange('technologyDescription', e.target.value)}
                  placeholder="使用する技術、革新性等を記載..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="marketAnalysis">市場分析</Label>
                <Textarea
                  id="marketAnalysis"
                  value={formData.marketAnalysis || ''}
                  onChange={(e) => handleInputChange('marketAnalysis', e.target.value)}
                  placeholder="対象市場、競合分析等を記載..."
                  rows={3}
                />
              </div>
            </div>
          </section>

          {/* サンプルデータ投入ボタン */}
          <section className="pt-4 border-t">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  updateFormData({
                    companyName: '株式会社イノベーション・ラボ',
                    representativeName: '田中 一郎',
                    address: '東京都港区六本木1-2-3 テクノロジーセンター10F',
                    phone: '03-5678-9012',
                    email: 'tanaka@innovation-lab.co.jp',
                    projectTitle: 'AI・IoT融合による製造業DXプラットフォーム開発',
                    projectDescription: '製造業における生産効率の向上を目的として、AI技術とIoTデバイスを融合させた次世代DXプラットフォームの開発を行います。リアルタイムデータ分析、予測保全、品質管理の自動化により、製造現場の生産性を30%向上させることを目標とします。',
                    requestAmount: 15000000,
                    projectPeriod: {
                      startDate: '2024-04-01',
                      endDate: '2025-03-31',
                    },
                    businessPlan: '国内製造業のDX化需要の高まりを背景に、中小製造業でも導入しやすい低コストで高機能なプラットフォームを提供します。独自のAIアルゴリズムにより、少量のデータからでも高精度な予測が可能です。',
                    technologyDescription: '深層学習による時系列データ分析、エッジコンピューティング技術、リアルタイムストリーミング処理を組み合わせた革新的なアーキテクチャを採用。従来システムの1/10のコストで同等以上の性能を実現します。',
                    marketAnalysis: '国内製造業DX市場は年間成長率15%で拡大中。特に中小企業向けの手軽なソリューション需要が高まっています。競合他社の高価格製品に対し、コストパフォーマンスで差別化を図ります。'
                  });
                }}
              >
                サンプルデータを投入
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  updateFormData({
                    companyName: '',
                    representativeName: '',
                    address: '',
                    phone: '',
                    email: '',
                    projectTitle: '',
                    projectDescription: '',
                    requestAmount: 0,
                    projectPeriod: {
                      startDate: '',
                      endDate: '',
                    },
                    businessPlan: '',
                    technologyDescription: '',
                    marketAnalysis: ''
                  });
                }}
              >
                クリア
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>

      {/* 右ペイン：プレビュー */}
      <div className="flex flex-col">
        <PreviewPanel className="flex-1" />
      </div>
    </div>
  );
}

export default function PreviewDemoPage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            プレビュー機能デモ
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            リアルタイム更新とPDFプレビュー機能のテストページ
          </p>
        </div>

        <PreviewProvider>
          <PreviewDemoForm />
        </PreviewProvider>
      </main>
    </AppLayout>
  );
}