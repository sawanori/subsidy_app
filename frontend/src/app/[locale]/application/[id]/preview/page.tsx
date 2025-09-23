'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { DocumentPreview } from '@/components/application/DocumentPreview';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [applicationData, setApplicationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch application data from API
    // Simulate API call
    setTimeout(() => {
      setApplicationData({
        id: params.id,
        status: 'draft',
        createdAt: new Date().toISOString(),
        basicInfo: {
          companyName: '株式会社サンプル',
          representativeName: '山田太郎',
          postalCode: '100-0001',
          address: '東京都千代田区千代田1-1',
          phone: '03-1234-5678',
          email: 'info@example.com',
          employeeCount: 5,
          capital: 1000,
          establishedYear: 2020,
          businessType: 'service',
        },
        businessPlan: {
          projectTitle: 'ECサイト構築による販路拡大事業',
          projectDescription: 'オンライン販売チャネルの構築により、新規顧客獲得と売上拡大を目指す事業です。',
          requestedAmount: 1000000,
          totalProjectCost: 1500000,
          implementationPeriod: {
            start: '2024-04-01',
            end: '2025-03-31',
          },
          expectedEffects: '売上30%増加、新規顧客100名獲得',
          salesTarget: {
            year1: 1000,
            year2: 1500,
            year3: 2000,
          },
        },
      });
      setIsLoading(false);
    }, 1000);
  }, [params.id]);

  const handleBack = () => {
    router.push('/ja/application/new');
  };

  const handleEdit = () => {
    router.push(`/ja/application/${params.id}/edit`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>書類を生成中...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
            <Button 
              variant="outline"
              onClick={handleEdit}
            >
              編集する
            </Button>
          </div>

          <DocumentPreview applicationData={applicationData} />
        </div>
      </div>
    </AppLayout>
  );
}