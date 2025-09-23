'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ApplicationWizard } from '@/components/application/ApplicationWizard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewApplicationPage() {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const handleComplete = (id: string) => {
    setApplicationId(id);
    router.push(`/ja/application/${id}/preview`);
  };

  const handleBack = () => {
    router.push('/ja');
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            ホームに戻る
          </Button>

          <ApplicationWizard onComplete={handleComplete} />
        </div>
      </div>
    </AppLayout>
  );
}