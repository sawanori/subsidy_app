import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { validateDesignTokens, WCAG_LEVELS } from "@/lib/contrast";
import { ErrorMessage } from "@/components/ui/error-message";

export default function ContrastTestPage() {
  const validationResults = validateDesignTokens();

  return (
    <AppLayout>
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              コントラスト検証テスト
            </h1>
            <p className="text-muted-foreground">
              WCAG 2.1 AA準拠のカラーコントラスト検証結果を確認できます。
            </p>
          </div>

          {/* WCAG Level Reference */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>WCAG コントラスト基準</CardTitle>
              <CardDescription>
                Webアクセシビリティガイドライン準拠基準
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">AA基準 (推奨)</h3>
                  <p>通常テキスト: {WCAG_LEVELS.AA_NORMAL}:1 以上</p>
                  <p>大きなテキスト: {WCAG_LEVELS.AA_LARGE}:1 以上</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">AAA基準 (最高)</h3>
                  <p>通常テキスト: {WCAG_LEVELS.AAA_NORMAL}:1 以上</p>
                  <p>大きなテキスト: {WCAG_LEVELS.AAA_LARGE}:1 以上</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Validation Results */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>カラーパレット検証結果</CardTitle>
              <CardDescription>
                デザイントークンのコントラスト比検証
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validationResults.map((result) => (
                  <div
                    key={result.name}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    style={{
                      backgroundColor: result.background,
                      color: result.foreground,
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="font-medium capitalize">
                        {result.name}
                      </div>
                      <div className="text-sm opacity-75">
                        {result.ratio}:1
                      </div>
                    </div>
                    <Badge 
                      variant={result.isCompliant ? "default" : "destructive"}
                      className="ml-4"
                    >
                      {result.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Error Message Examples */}
          <Card>
            <CardHeader>
              <CardTitle>エラーメッセージ可視性テスト</CardTitle>
              <CardDescription>
                様々なエラーメッセージの表示例
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ErrorMessage 
                message="必須項目が入力されていません。すべての項目を入力してください。"
                variant="error"
              />
              <ErrorMessage 
                message="入力内容に問題があります。確認してください。"
                variant="warning"
              />
              <ErrorMessage 
                message="フォームの保存が完了しました。"
                variant="success"
              />
              <ErrorMessage 
                message="システムメンテナンスのお知らせ：本日23:00-01:00"
                variant="info"
              />
            </CardContent>
          </Card>

          {/* High Contrast Mode Test */}
          <div className="mt-8 p-4 border-2 border-dashed border-muted-foreground rounded-lg">
            <h2 className="text-lg font-semibold mb-2">
              ハイコントラストモード対応テスト
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              OSのハイコントラストモードで表示を確認してください
            </p>
            <div className="space-x-4">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded border-2 border-transparent hover:border-primary-foreground">
                プライマリボタン
              </button>
              <button className="px-4 py-2 bg-transparent text-foreground border-2 border-current rounded hover:bg-muted">
                セカンダリボタン
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}