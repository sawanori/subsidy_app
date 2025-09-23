'use client';

import React from 'react';
import { SubsidyFormData, PreviewConfig } from '@/types/preview';
import { formatCurrency, formatDate } from '@/lib/utils';

interface FormTwoPreviewProps {
  formData: SubsidyFormData;
  config: PreviewConfig;
  className?: string;
}

export function FormTwoPreview({ formData, config, className = '' }: FormTwoPreviewProps) {
  return (
    <div className={`${className} bg-white p-8 overflow-auto`}>
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">
          事業計画書（様式第2号）
        </h1>
        <div className="text-right text-sm text-gray-600">
          作成日：{formatDate(new Date().toISOString())}
        </div>
      </div>

      {/* 事業概要 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          1. 事業概要
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              事業名
            </label>
            <div className="border border-gray-300 p-4 bg-yellow-50 min-h-12">
              {formData.projectTitle || '（事業名を入力してください）'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              事業の背景・目的
            </label>
            <div className="border border-gray-300 p-4 min-h-32 bg-gray-50">
              {formData.businessPlan || 
                '（事業を実施する背景、解決したい課題、目的を具体的に記載してください）'
              }
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              技術的内容・革新性
            </label>
            <div className="border border-gray-300 p-4 min-h-32 bg-gray-50">
              {formData.technologyDescription || 
                '（使用する技術、技術的な革新性、従来技術との差別化点を記載してください）'
              }
            </div>
          </div>
        </div>
      </section>

      {/* 市場分析・競争優位性 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          2. 市場分析・競争優位性
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              対象市場・顧客層
            </label>
            <div className="border border-gray-300 p-4 min-h-24 bg-gray-50">
              {formData.marketAnalysis || 
                '（想定する顧客層、市場規模、市場の成長性について記載してください）'
              }
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                競合他社・サービス
              </label>
              <div className="border border-gray-300 p-4 min-h-24 bg-gray-50 text-sm">
                （主要な競合他社・競合サービスを記載）
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                差別化・優位性
              </label>
              <div className="border border-gray-300 p-4 min-h-24 bg-gray-50 text-sm">
                （競合に対する優位性、差別化要因を記載）
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 実施体制・スケジュール */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          3. 実施体制・スケジュール
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              実施体制
            </label>
            <div className="border border-gray-300 p-4 min-h-24 bg-gray-50">
              プロジェクトマネージャー：{formData.representativeName || '（未設定）'}
              <br />
              実施体制：{formData.companyName || '（未設定）'}
              <br />
              （役割分担、外部委託先等を記載してください）
            </div>
          </div>
          
          {formData.timeline && formData.timeline.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                実施スケジュール
              </label>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">フェーズ</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">内容</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">開始</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">完了</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">成果物</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.timeline.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">
                          {item.phase}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {item.description}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                          {formatDate(item.startDate)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                          {formatDate(item.endDate)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm">
                          {item.deliverables.join('、')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                実施スケジュール
              </label>
              <div className="border border-gray-300 p-4 min-h-32 bg-gray-50 text-center text-gray-500">
                （スケジュールを設定してください）
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 期待効果・成果 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          4. 期待効果・成果目標
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              定量的効果
            </label>
            <div className="space-y-3">
              <div className="border border-gray-300 p-3 bg-blue-50">
                <div className="text-sm font-medium">売上目標</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(formData.requestAmount * 5)}円/年
                </div>
              </div>
              <div className="border border-gray-300 p-3 bg-green-50">
                <div className="text-sm font-medium">雇用創出</div>
                <div className="text-lg font-bold text-green-600">5名</div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              定性的効果
            </label>
            <div className="border border-gray-300 p-4 min-h-32 bg-gray-50 text-sm">
              ・地域経済の活性化
              <br />
              ・技術力向上・人材育成
              <br />
              ・新たなビジネスモデルの確立
              <br />
              ・産学官連携の促進
            </div>
          </div>
        </div>
      </section>

      {/* リスク管理 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          5. リスク管理・対応策
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-red-50">
                <th className="border border-gray-300 px-4 py-2 text-left">リスク項目</th>
                <th className="border border-gray-300 px-4 py-2 text-center">影響度</th>
                <th className="border border-gray-300 px-4 py-2 text-center">発生確率</th>
                <th className="border border-gray-300 px-4 py-2 text-left">対応策</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">技術開発の遅延</td>
                <td className="border border-gray-300 px-4 py-2 text-center">高</td>
                <td className="border border-gray-300 px-4 py-2 text-center">中</td>
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  段階的開発、外部専門家の活用
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">市場環境の変化</td>
                <td className="border border-gray-300 px-4 py-2 text-center">中</td>
                <td className="border border-gray-300 px-4 py-2 text-center">低</td>
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  定期的な市場調査、計画の柔軟な修正
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">人材確保の困難</td>
                <td className="border border-gray-300 px-4 py-2 text-center">中</td>
                <td className="border border-gray-300 px-4 py-2 text-center">中</td>
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  早期採用活動、教育研修の充実
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* フッター */}
      <div className="text-center mt-12 pt-8 border-t border-gray-300">
        <div className="text-sm text-gray-600">
          この事業計画書は電子申請システムにより作成されました。
        </div>
        <div className="text-xs text-gray-500 mt-2">
          最終更新：{formatDate(formData.lastUpdated)} | バージョン：{formData.version}
        </div>
      </div>
    </div>
  );
}