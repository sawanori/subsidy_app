'use client';

import React from 'react';
import { SubsidyFormData, PreviewConfig } from '@/types/preview';
import { formatCurrency, formatDate } from '@/lib/utils';

interface FormOnePreviewProps {
  formData: SubsidyFormData;
  config: PreviewConfig;
  className?: string;
}

export function FormOnePreview({ formData, config, className = '' }: FormOnePreviewProps) {
  return (
    <div className={`${className} bg-white p-8 overflow-auto`}>
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">
          補助金申請書（様式第1号）
        </h1>
        <div className="text-right text-sm text-gray-600">
          申請日：{formatDate(new Date().toISOString())}
        </div>
      </div>

      {/* 基本情報セクション */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          1. 申請者情報
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                法人・団体名
              </label>
              <div className="border-b border-gray-300 pb-1 min-h-6">
                {formData.companyName || '（未入力）'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                代表者氏名
              </label>
              <div className="border-b border-gray-300 pb-1 min-h-6">
                {formData.representativeName || '（未入力）'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                所在地
              </label>
              <div className="border-b border-gray-300 pb-1 min-h-6">
                {formData.address || '（未入力）'}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話番号
              </label>
              <div className="border-b border-gray-300 pb-1 min-h-6">
                {formData.phone || '（未入力）'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <div className="border-b border-gray-300 pb-1 min-h-6">
                {formData.email || '（未入力）'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* プロジェクト情報セクション */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          2. 補助事業の概要
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              事業名
            </label>
            <div className="border border-gray-300 p-3 min-h-12 bg-gray-50">
              {formData.projectTitle || '（事業名を入力してください）'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              事業の内容
            </label>
            <div className="border border-gray-300 p-3 min-h-32 bg-gray-50">
              {formData.projectDescription || '（事業内容を詳しく記載してください）'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                事業実施期間（開始）
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
                事業実施期間（終了）
              </label>
              <div className="border-b border-gray-300 pb-1 min-h-6">
                {formData.projectPeriod.endDate ? 
                  formatDate(formData.projectPeriod.endDate) : 
                  '（未設定）'
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 予算情報セクション */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          3. 補助金申請額
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              申請金額
            </label>
            <div className="text-2xl font-bold text-blue-600 border-2 border-blue-200 p-4 bg-blue-50 text-center">
              {formData.requestAmount > 0 ? 
                `${formatCurrency(formData.requestAmount)}円` : 
                '金額未設定'
              }
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <div>事業費総額：{formatCurrency(formData.requestAmount * 1.2)}円（想定）</div>
              <div>自己負担額：{formatCurrency(formData.requestAmount * 0.2)}円（想定）</div>
              <div>補助率：最大80%</div>
            </div>
          </div>
        </div>
      </section>

      {/* 予算内訳 */}
      {formData.budgetBreakdown && formData.budgetBreakdown.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
            4. 事業費内訳
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">項目</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">内容</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">単価</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">数量</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">合計</th>
                </tr>
              </thead>
              <tbody>
                {formData.budgetBreakdown.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="border border-gray-300 px-4 py-2">{item.category}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(item.unitPrice)}円
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      {formatCurrency(item.total)}円
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 font-semibold">
                  <td className="border border-gray-300 px-4 py-2" colSpan={4}>
                    合計
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(
                      formData.budgetBreakdown.reduce((sum, item) => sum + item.total, 0)
                    )}円
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* 特記事項・添付資料 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          5. 添付書類
        </h2>
        
        <div className="bg-gray-50 p-4 border border-gray-300">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium mb-2">必要書類：</div>
              <ul className="space-y-1 text-gray-700">
                <li>☑ 事業計画書</li>
                <li>☑ 収支予算書</li>
                <li>☑ 法人登記簿謄本</li>
                <li>☑ 直近決算書</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-2">提出状況：</div>
              <ul className="space-y-1 text-gray-700">
                <li>📎 事業計画書.pdf</li>
                <li>📎 予算書.xlsx</li>
                <li>⚪ 登記簿謄本（準備中）</li>
                <li>⚪ 決算書（準備中）</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <div className="text-center mt-12 pt-8 border-t border-gray-300">
        <div className="text-sm text-gray-600">
          この申請書は電子申請システムにより作成されました。
        </div>
        <div className="text-xs text-gray-500 mt-2">
          最終更新：{formatDate(formData.lastUpdated)} | バージョン：{formData.version}
        </div>
      </div>
    </div>
  );
}