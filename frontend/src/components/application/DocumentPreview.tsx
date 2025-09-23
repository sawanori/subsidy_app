'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  Printer, 
  Share2, 
  CheckCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye
} from 'lucide-react';

interface DocumentPreviewProps {
  applicationData: any;
}

export function DocumentPreview({ applicationData }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [selectedDocument, setSelectedDocument] = useState('form1');
  const [isGenerating, setIsGenerating] = useState(false);

  const documents = [
    { id: 'form1', name: '様式1：経営計画書', pages: 3, status: 'ready' },
    { id: 'form2', name: '様式2：補助事業計画書', pages: 2, status: 'ready' },
    { id: 'form3', name: '様式3：事業支援計画書', pages: 2, status: 'ready' },
    { id: 'form4', name: '様式4：事業承継診断票', pages: 1, status: 'ready' },
    { id: 'appendixA', name: '付録A：収支計算書', pages: 1, status: 'ready' },
    { id: 'appendixB', name: '付録B：資金調達計画', pages: 1, status: 'ready' },
    { id: 'appendixC', name: '付録C：事業実施スケジュール', pages: 1, status: 'ready' },
  ];

  const handleDownload = async (format: 'pdf' | 'docx') => {
    setIsGenerating(true);
    // TODO: Call API to generate document
    setTimeout(() => {
      setIsGenerating(false);
      // Simulate download
      const link = document.createElement('a');
      link.href = '#';
      link.download = `申請書類_${applicationData.id}.${format}`;
      link.click();
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  const renderDocumentContent = (documentId: string) => {
    // Sample content based on document type
    switch (documentId) {
      case 'form1':
        return renderForm1();
      case 'form2':
        return renderForm2();
      default:
        return renderGenericForm(documentId);
    }
  };

  const renderForm1 = () => (
    <div className="bg-white p-8 shadow-lg" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">経営計画書</h1>
        <p className="text-sm text-gray-600">（様式1）</p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-3">1. 企業概要</h2>
          <table className="w-full">
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium w-1/3">事業者名</td>
                <td className="py-2">{applicationData.basicInfo.companyName}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">代表者名</td>
                <td className="py-2">{applicationData.basicInfo.representativeName}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">所在地</td>
                <td className="py-2">〒{applicationData.basicInfo.postalCode} {applicationData.basicInfo.address}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">電話番号</td>
                <td className="py-2">{applicationData.basicInfo.phone}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">従業員数</td>
                <td className="py-2">{applicationData.basicInfo.employeeCount}名</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">資本金</td>
                <td className="py-2">{applicationData.basicInfo.capital.toLocaleString()}万円</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-3">2. 経営方針・目標と今後のプラン</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm leading-relaxed">
              当社は、{applicationData.businessPlan.projectTitle}を通じて、
              地域の小規模事業者として持続的な成長を目指します。
              具体的には、{applicationData.businessPlan.expectedEffects}を実現し、
              地域経済の活性化に貢献してまいります。
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-3">3. 自社や自社の提供する商品・サービスの強み</h2>
          <div className="bg-gray-50 p-4 rounded">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>地域に根ざした{applicationData.basicInfo.establishedYear}年創業の実績</li>
              <li>顧客ニーズに応じた柔軟な対応力</li>
              <li>専門性の高いスタッフによる高品質なサービス</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-3">4. 経営上の課題</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm leading-relaxed">
              現在の主な課題として、新規顧客獲得チャネルの不足、
              デジタル化の遅れ、若手人材の確保などが挙げられます。
              本補助事業により、これらの課題解決を図ります。
            </p>
          </div>
        </section>
      </div>

      <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
        <p>申請ID: {applicationData.id} | 作成日: {new Date(applicationData.createdAt).toLocaleDateString('ja-JP')}</p>
      </div>
    </div>
  );

  const renderForm2 = () => (
    <div className="bg-white p-8 shadow-lg" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">補助事業計画書</h1>
        <p className="text-sm text-gray-600">（様式2）</p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-3">1. 補助事業の内容</h2>
          <div className="space-y-3">
            <div>
              <label className="font-medium text-sm">補助事業名：</label>
              <p className="mt-1">{applicationData.businessPlan.projectTitle}</p>
            </div>
            <div>
              <label className="font-medium text-sm">事業内容：</label>
              <p className="mt-1 text-sm leading-relaxed bg-gray-50 p-3 rounded">
                {applicationData.businessPlan.projectDescription}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-3">2. 補助事業の効果</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm leading-relaxed mb-3">{applicationData.businessPlan.expectedEffects}</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">項目</th>
                  <th className="text-right py-2">1年目</th>
                  <th className="text-right py-2">2年目</th>
                  <th className="text-right py-2">3年目</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2">売上目標（万円）</td>
                  <td className="text-right py-2">{applicationData.businessPlan.salesTarget.year1}</td>
                  <td className="text-right py-2">{applicationData.businessPlan.salesTarget.year2}</td>
                  <td className="text-right py-2">{applicationData.businessPlan.salesTarget.year3}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold border-b pb-2 mb-3">3. 経費明細表</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">経費区分</th>
                <th className="text-right p-2">金額（円）</th>
                <th className="text-left p-2">備考</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">機械装置等費</td>
                <td className="text-right p-2">500,000</td>
                <td className="p-2">ECサイト構築費用</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">広報費</td>
                <td className="text-right p-2">300,000</td>
                <td className="p-2">Web広告、チラシ作成</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">展示会等出展費</td>
                <td className="text-right p-2">200,000</td>
                <td className="p-2">展示会出展料</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">開発費</td>
                <td className="text-right p-2">500,000</td>
                <td className="p-2">新商品開発</td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="p-2">合計</td>
                <td className="text-right p-2">{applicationData.businessPlan.totalProjectCost.toLocaleString()}</td>
                <td className="p-2"></td>
              </tr>
              <tr className="bg-blue-50 font-bold">
                <td className="p-2">補助金申請額</td>
                <td className="text-right p-2">{applicationData.businessPlan.requestedAmount.toLocaleString()}</td>
                <td className="p-2">補助率2/3</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
        <p>申請ID: {applicationData.id} | 作成日: {new Date(applicationData.createdAt).toLocaleDateString('ja-JP')}</p>
      </div>
    </div>
  );

  const renderGenericForm = (documentId: string) => (
    <div className="bg-white p-8 shadow-lg" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {documents.find(d => d.id === documentId)?.name}
        </h1>
      </div>
      <div className="h-96 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4" />
          <p>プレビュー準備中...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>申請書類プレビュー</CardTitle>
              <CardDescription>
                生成された書類を確認し、必要に応じてダウンロードしてください
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <CheckCircle className="h-3 w-3 mr-1" />
                生成完了
              </Badge>
              <Badge>
                全{documents.length}書類
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              すべての書類が正常に生成されました。内容を確認の上、PDFまたはDOCX形式でダウンロードしてください。
            </AlertDescription>
          </Alert>

          <div className="flex gap-4 mb-6">
            <Button 
              onClick={() => handleDownload('pdf')}
              disabled={isGenerating}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF一括ダウンロード
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleDownload('docx')}
              disabled={isGenerating}
            >
              <Download className="mr-2 h-4 w-4" />
              DOCX一括ダウンロード
            </Button>
            <Button 
              variant="outline"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              印刷
            </Button>
            <Button 
              variant="outline"
            >
              <Share2 className="mr-2 h-4 w-4" />
              共有
            </Button>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <h3 className="font-semibold mb-3">書類一覧</h3>
              <div className="space-y-2">
                {documents.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc.id)}
                    className={`
                      w-full text-left p-3 rounded-lg border transition-colors
                      ${selectedDocument === doc.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:bg-gray-50'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{doc.name.split('：')[1]}</p>
                        <p className="text-xs text-gray-500">{doc.pages}ページ</p>
                      </div>
                      {doc.status === 'ready' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="border rounded-lg">
                <div className="border-b p-3 bg-gray-50 flex items-center justify-between">
                  <h3 className="font-semibold">
                    {documents.find(d => d.id === selectedDocument)?.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomOut}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-2">{zoom}%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomIn}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomReset}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 overflow-auto" style={{ maxHeight: '800px' }}>
                  {renderDocumentContent(selectedDocument)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}