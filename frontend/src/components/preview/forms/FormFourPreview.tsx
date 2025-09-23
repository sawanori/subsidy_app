'use client';

import React from 'react';
import { SubsidyFormData, PreviewConfig } from '@/types/preview';
import { formatCurrency, formatDate } from '@/lib/utils';

interface FormFourPreviewProps {
  formData: SubsidyFormData;
  config: PreviewConfig;
  className?: string;
}

export function FormFourPreview({ formData, config, className = '' }: FormFourPreviewProps) {
  return (
    <div className={`${className} bg-white p-8 overflow-auto`}>
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">
          収支予算書（様式第4号）
        </h1>
        <div className="text-right text-sm text-gray-600">
          作成日：{formatDate(new Date().toISOString())}
        </div>
      </div>

      {/* 事業概要 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          事業概要
        </h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              事業名
            </label>
            <div className="border-b border-gray-300 pb-1 min-h-6">
              {formData.projectTitle || '（未入力）'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              申請者
            </label>
            <div className="border-b border-gray-300 pb-1 min-h-6">
              {formData.companyName || '（未入力）'}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              事業期間（開始）
            </label>
            <div className="border-b border-gray-300 pb-1 min-h-6">
              {formData.projectPeriod.startDate ? 
                formatDate(formData.projectPeriod.startDate) : 
                '（未設定）'
              }
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              事業期間（終了）
            </label>
            <div className="border-b border-gray-300 pb-1 min-h-6">
              {formData.projectPeriod.endDate ? 
                formatDate(formData.projectPeriod.endDate) : 
                '（未設定）'
              }
            </div>
          </div>
        </div>
      </section>

      {/* 収入の部 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          収入の部
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-4 py-3 text-left">収入項目</th>
                <th className="border border-gray-300 px-4 py-3 text-right w-32">金額（円）</th>
                <th className="border border-gray-300 px-4 py-3 text-left">備考</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-medium">
                  補助金
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right font-bold text-blue-600">
                  {formatCurrency(formData.requestAmount)}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm">
                  申請補助金額
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-medium">
                  自己資金
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  {formatCurrency(Math.round(formData.requestAmount * 0.25))}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm">
                  自己負担分（25%）
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-medium">
                  その他収入
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  0
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm">
                  銀行借入、協力企業支援等
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-blue-100 font-bold">
                <td className="border border-gray-300 px-4 py-3">
                  合計
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right text-lg">
                  {formatCurrency(Math.round(formData.requestAmount * 1.25))}
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  総事業費
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* 支出の部 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          支出の部
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-red-50">
                <th className="border border-gray-300 px-4 py-3 text-left">支出項目</th>
                <th className="border border-gray-300 px-4 py-3 text-center w-20">単位</th>
                <th className="border border-gray-300 px-4 py-3 text-right w-24">単価</th>
                <th className="border border-gray-300 px-4 py-3 text-right w-20">数量</th>
                <th className="border border-gray-300 px-4 py-3 text-right w-32">金額（円）</th>
                <th className="border border-gray-300 px-4 py-3 text-left">積算根拠・備考</th>
              </tr>
            </thead>
            <tbody>
              {formData.budgetBreakdown && formData.budgetBreakdown.length > 0 ? (
                formData.budgetBreakdown.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="border border-gray-300 px-4 py-3">
                      <div className="font-medium">{item.category}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                      式/個/人月
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">
                      {item.category}の詳細積算
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3">
                      <div className="font-medium">人件費</div>
                      <div className="text-sm text-gray-600">開発チーム</div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm">人月</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">800,000</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">6</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      {formatCurrency(4800000)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">
                      シニアエンジニア2名×3ヶ月
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3">
                      <div className="font-medium">設備費</div>
                      <div className="text-sm text-gray-600">開発機器</div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm">式</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">2,000,000</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">1</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      {formatCurrency(2000000)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">
                      開発サーバー、テスト環境
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3">
                      <div className="font-medium">外注費</div>
                      <div className="text-sm text-gray-600">専門技術支援</div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm">式</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">1,500,000</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">1</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      {formatCurrency(1500000)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">
                      AIアルゴリズム開発支援
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3">
                      <div className="font-medium">その他経費</div>
                      <div className="text-sm text-gray-600">消耗品・旅費等</div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm">式</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">200,000</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">1</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      {formatCurrency(200000)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">
                      消耗品、調査旅費、会議費
                    </td>
                  </tr>
                </>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-red-100 font-bold">
                <td className="border border-gray-300 px-4 py-3" colSpan={4}>
                  合計
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right text-lg">
                  {formatCurrency(
                    formData.budgetBreakdown && formData.budgetBreakdown.length > 0
                      ? formData.budgetBreakdown.reduce((sum, item) => sum + item.total, 0)
                      : 8500000
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  総支出額
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* 補助対象経費の内訳 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          補助対象経費の分類
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3 text-green-700">補助対象経費</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-green-50 border border-green-200">
                <span>人件費（直接従事分）</span>
                <span className="font-semibold">{formatCurrency(formData.requestAmount * 0.6)}円</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 border border-green-200">
                <span>設備費（専用機器）</span>
                <span className="font-semibold">{formatCurrency(formData.requestAmount * 0.25)}円</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 border border-green-200">
                <span>外注費（技術開発）</span>
                <span className="font-semibold">{formatCurrency(formData.requestAmount * 0.15)}円</span>
              </div>
              <div className="flex justify-between p-2 bg-green-100 border border-green-300 font-bold">
                <span>小計</span>
                <span>{formatCurrency(formData.requestAmount)}円</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3 text-gray-700">補助対象外経費</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-gray-50 border border-gray-200">
                <span>一般管理費</span>
                <span className="font-semibold">{formatCurrency(formData.requestAmount * 0.1)}円</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 border border-gray-200">
                <span>間接経費</span>
                <span className="font-semibold">{formatCurrency(formData.requestAmount * 0.05)}円</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 border border-gray-200">
                <span>土地・建物取得費</span>
                <span className="font-semibold">0円</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-100 border border-gray-300 font-bold">
                <span>小計</span>
                <span>{formatCurrency(formData.requestAmount * 0.15)}円</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 資金調達計画 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          資金調達計画
        </h2>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4">
          <h3 className="font-medium mb-3">調達方法</h3>
          <div className="text-sm space-y-2">
            <div>• <strong>補助金</strong>：{formatCurrency(formData.requestAmount)}円（{Math.round((formData.requestAmount / (formData.requestAmount * 1.25)) * 100)}%）</div>
            <div>• <strong>自己資金</strong>：{formatCurrency(formData.requestAmount * 0.25)}円（20%）</div>
            <div>• <strong>銀行借入</strong>：検討中</div>
            <div>• <strong>資金調達時期</strong>：事業開始1ヶ月前までに確保</div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <div className="text-center mt-12 pt-8 border-t border-gray-300">
        <div className="text-sm text-gray-600">
          この収支予算書は電子申請システムにより作成されました。
        </div>
        <div className="text-xs text-gray-500 mt-2">
          最終更新：{formatDate(formData.lastUpdated)} | バージョン：{formData.version}
        </div>
      </div>
    </div>
  );
}