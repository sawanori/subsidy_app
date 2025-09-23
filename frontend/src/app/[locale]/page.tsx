'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Download,
  Clock,
  Shield,
  Zap,
  FileCheck
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations();
  const router = useRouter();

  const handleStartApplication = () => {
    router.push('/ja/application/new');
  };

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              小規模事業者持続化補助金対応
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              補助金申請書類を自動生成
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              複雑な申請書類作成を簡単に。必要な情報を入力するだけで、
              小規模事業者持続化補助金の申請書類を自動生成します。
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={handleStartApplication}>
                <FileText className="mr-2 h-5 w-5" />
                申請書類を作成する
              </Button>
              <Button variant="outline" size="lg">
                <Download className="mr-2 h-5 w-5" />
                サンプルを見る
              </Button>
            </div>
          </section>

          {/* Process Steps */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-center mb-8">
              簡単3ステップで申請書類を作成
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>1. 基本情報を入力</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    事業者情報、申請金額、事業計画など必要な情報をウィザード形式で入力
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>2. 証拠書類をアップロード</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    見積書、事業計画書などの証拠書類をアップロード。OCRで自動読み取り
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>3. 書類を生成・ダウンロード</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    プレビューで確認後、PDF形式で申請書類一式をダウンロード
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Features Grid */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-center mb-8">
              主な機能
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">高速処理</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    2秒以内にプレビュー生成
                    99%以上の成功率
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">セキュア</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AES256暗号化
                    ウイルススキャン実装
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileCheck className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">自動検証</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    申請要件の自動チェック
                    不備の事前検出
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">時間削減</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    手作業の80%削減
                    申請準備期間を短縮
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Supported Documents */}
          <section className="mb-16">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-0">
              <CardHeader>
                <CardTitle className="text-2xl text-center">生成可能な書類</CardTitle>
                <CardDescription className="text-center text-base">
                  小規模事業者持続化補助金の申請に必要な書類を一括生成
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span>様式1：経営計画書</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span>様式2：補助事業計画書</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span>様式3：事業支援計画書</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span>様式4：事業承継診断票</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span>付録A：収支計算書</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span>付録B：資金調達計画</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span>付録C：事業実施スケジュール</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span>電子署名・押印対応</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Call to Action */}
          <section className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              今すぐ申請書類の作成を開始
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              無料でお試しいただけます。クレジットカード不要。
            </p>
            <Button size="lg" onClick={handleStartApplication}>
              <FileText className="mr-2 h-5 w-5" />
              申請書類を作成する
            </Button>
          </section>
        </div>
      </main>
    </AppLayout>
  );
}