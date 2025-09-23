'use client';

import React from 'react';
import { SubsidyFormData, PreviewConfig } from '@/types/preview';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle, AlertCircle, XCircle, FileText, Calendar, DollarSign, Users } from 'lucide-react';

interface ConfirmationPreviewProps {
  formData: SubsidyFormData;
  config: PreviewConfig;
  className?: string;
}

export function ConfirmationPreview({ formData, config, className = '' }: ConfirmationPreviewProps) {
  // 入力完了度の計算
  const getCompletionStatus = () => {
    const requiredFields = [
      formData.companyName,
      formData.representativeName,
      formData.address,
      formData.phone,
      formData.email,
      formData.projectTitle,
      formData.projectDescription,
      formData.requestAmount > 0,
      formData.projectPeriod.startDate,
      formData.projectPeriod.endDate,
    ];
    
    const completedFields = requiredFields.filter(Boolean).length;
    return {
      completed: completedFields,
      total: requiredFields.length,
      percentage: Math.round((completedFields / requiredFields.length) * 100)
    };
  };

  const status = getCompletionStatus();
  
  const getStatusIcon = (isComplete: boolean) => {
    return isComplete ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  return (
    <div className={`${className} bg-white p-8 overflow-auto`}>
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">
          申請内容確認書
        </h1>
        <div className="text-right text-sm text-gray-600">
          確認日：{formatDate(new Date().toISOString())}
        </div>
      </div>

      {/* 入力完了状況 */}
      <section className="mb-8">
        <div className={`p-6 rounded-lg border-2 ${
          status.percentage === 100 
            ? 'bg-green-50 border-green-200' 
            : status.percentage >= 80 
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              入力完了状況
            </h2>
            <div className={`text-2xl font-bold ${
              status.percentage === 100 ? 'text-green-600' : 
              status.percentage >= 80 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {status.percentage}%
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex-1 bg-gray-200 rounded-full h-3 ${
              status.percentage === 100 ? 'bg-green-200' : ''
            }`}>
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  status.percentage === 100 ? 'bg-green-600' : 
                  status.percentage >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${status.percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {status.completed}/{status.total} 項目完了
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            {status.percentage === 100 ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                すべての必須項目が入力済みです。申請準備完了！
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-4 w-4" />
                {10 - status.completed}個の必須項目が未入力です。
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 申請者情報確認 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          1. 申請者情報の確認
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-medium text-gray-700">法人・団体名</div>
                <div className="font-semibold">
                  {formData.companyName || '未入力'}
                </div>
              </div>
              {getStatusIcon(!!formData.companyName)}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-medium text-gray-700">代表者氏名</div>
                <div className="font-semibold">
                  {formData.representativeName || '未入力'}
                </div>
              </div>
              {getStatusIcon(!!formData.representativeName)}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-medium text-gray-700">所在地</div>
                <div className="font-semibold text-sm">
                  {formData.address || '未入力'}
                </div>
              </div>
              {getStatusIcon(!!formData.address)}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-medium text-gray-700">電話番号</div>
                <div className="font-semibold">
                  {formData.phone || '未入力'}
                </div>
              </div>
              {getStatusIcon(!!formData.phone)}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-medium text-gray-700">メールアドレス</div>
                <div className="font-semibold text-sm">
                  {formData.email || '未入力'}
                </div>
              </div>
              {getStatusIcon(!!formData.email)}
            </div>
          </div>
        </div>
      </section>

      {/* 事業内容確認 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          2. 事業内容の確認
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-blue-50 rounded border border-blue-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="text-sm font-medium text-gray-700">事業名</div>
              </div>
              <div className="font-semibold text-lg">
                {formData.projectTitle || '事業名が未入力です'}
              </div>
            </div>
            {getStatusIcon(!!formData.projectTitle)}
          </div>
          
          <div className="flex items-start justify-between p-4 bg-gray-50 rounded">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700 mb-2">事業の内容</div>
              <div className="text-sm">
                {formData.projectDescription || '事業内容が未入力です'}
              </div>
            </div>
            {getStatusIcon(!!formData.projectDescription)}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded border border-green-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div className="text-sm font-medium text-gray-700">開始日</div>
                </div>
                <div className="font-semibold">
                  {formData.projectPeriod.startDate ? 
                    formatDate(formData.projectPeriod.startDate) : 
                    '未設定'
                  }
                </div>
              </div>
              {getStatusIcon(!!formData.projectPeriod.startDate)}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded border border-green-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div className="text-sm font-medium text-gray-700">終了日</div>
                </div>
                <div className="font-semibold">
                  {formData.projectPeriod.endDate ? 
                    formatDate(formData.projectPeriod.endDate) : 
                    '未設定'
                  }
                </div>
              </div>
              {getStatusIcon(!!formData.projectPeriod.endDate)}
            </div>
          </div>
        </div>
      </section>

      {/* 申請金額確認 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          3. 申請金額の確認
        </h2>
        
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-yellow-600" />
              <div>
                <div className="text-sm font-medium text-gray-700">補助金申請額</div>
                <div className="text-3xl font-bold text-yellow-700">
                  {formData.requestAmount > 0 ? 
                    `${formatCurrency(formData.requestAmount)}円` : 
                    '金額未設定'
                  }
                </div>
              </div>
            </div>
            {getStatusIcon(formData.requestAmount > 0)}
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-white rounded border">
              <div className="font-medium text-gray-700">事業費総額</div>
              <div className="font-bold text-lg">
                {formatCurrency(formData.requestAmount * 1.25)}円
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="font-medium text-gray-700">自己負担額</div>
              <div className="font-bold text-lg">
                {formatCurrency(formData.requestAmount * 0.25)}円
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="font-medium text-gray-700">補助率</div>
              <div className="font-bold text-lg text-yellow-600">80%</div>
            </div>
          </div>
        </div>
      </section>

      {/* 提出書類確認 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          4. 提出書類の確認
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3 text-green-700">作成完了書類</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">様式第1号（申請書）</span>
                </div>
                <span className="text-xs text-green-600">作成済み</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">様式第2号（事業計画書）</span>
                </div>
                <span className="text-xs text-green-600">作成済み</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">様式第4号（収支予算書）</span>
                </div>
                <span className="text-xs text-green-600">作成済み</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3 text-orange-700">添付書類準備状況</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">法人登記簿謄本</span>
                </div>
                <span className="text-xs text-orange-600">準備中</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">直近決算書</span>
                </div>
                <span className="text-xs text-orange-600">準備中</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">印鑑証明書</span>
                </div>
                <span className="text-xs text-green-600">準備済み</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 申請前チェックリスト */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          5. 申請前チェックリスト
        </h2>
        
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
          <div className="grid grid-cols-1 gap-3">
            {[
              { text: '申請者情報に誤りがないことを確認しました', completed: status.percentage >= 50 },
              { text: '事業内容が具体的かつ明確に記載されています', completed: !!formData.projectDescription },
              { text: '事業期間が適切に設定されています', completed: !!(formData.projectPeriod.startDate && formData.projectPeriod.endDate) },
              { text: '申請金額の根拠が明確です', completed: formData.requestAmount > 0 },
              { text: '必要な添付書類が準備できています', completed: false },
              { text: '申請要項・条件を確認しました', completed: true },
            ].map((item, index) => (
              <div 
                key={index}
                className={`flex items-center gap-3 p-3 rounded ${
                  item.completed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                {item.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`text-sm ${item.completed ? 'text-green-800' : 'text-red-800'}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 申請準備状況 */}
      <section className="mb-8">
        <div className={`p-6 rounded-lg text-center ${
          status.percentage === 100 
            ? 'bg-green-100 border-2 border-green-300'
            : 'bg-yellow-100 border-2 border-yellow-300'
        }`}>
          <div className={`text-2xl font-bold mb-2 ${
            status.percentage === 100 ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {status.percentage === 100 ? '申請準備完了' : '申請準備中'}
          </div>
          <div className="text-sm mb-4">
            {status.percentage === 100 
              ? 'すべての必須項目が完了しています。申請を進めることができます。'
              : `残り ${10 - status.completed} 項目の入力が必要です。`
            }
          </div>
          {status.percentage === 100 && (
            <div className="text-xs text-green-600">
              ※ 提出前に添付書類の準備と最終確認を行ってください
            </div>
          )}
        </div>
      </section>

      {/* フッター */}
      <div className="text-center mt-12 pt-8 border-t border-gray-300">
        <div className="text-sm text-gray-600">
          この確認書は電子申請システムにより自動生成されました。
        </div>
        <div className="text-xs text-gray-500 mt-2">
          最終更新：{formatDate(formData.lastUpdated)} | バージョン：{formData.version}
        </div>
      </div>
    </div>
  );
}