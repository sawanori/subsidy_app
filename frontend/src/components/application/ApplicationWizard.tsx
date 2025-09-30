'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ChevronRight,
  ChevronLeft,
  Building2,
  FileText,
  Upload,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { BusinessPlanStep } from './steps/BusinessPlanStep';
import { EvidenceUploadStep } from './steps/EvidenceUploadStep';
import { ReviewStep } from './steps/ReviewStep';
import { PurposeBackgroundStep } from './steps/PurposeBackgroundStep';
import { DetailedPlanStep } from './steps/DetailedPlanStep';
import { KPITargetStep } from './steps/KPITargetStep';
import { AutoPlanForm } from '../auto-plan/AutoPlanForm';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type {
  PurposeBackground,
  DetailedPlan,
  KpiTarget
} from '@/types/application-extended';

interface ApplicationWizardProps {
  onComplete: (applicationId: string) => void;
}

export interface ApplicationData {
  basicInfo: {
    companyName: string;
    representativeName: string;
    postalCode: string;
    address: string;
    phone: string;
    email: string;
    employeeCount: number;
    capital: number;
    establishedYear: number;
    businessType: string;
  };
  businessPlan: {
    projectTitle: string;
    projectDescription: string;
    requestedAmount: number;
    totalProjectCost: number;
    implementationPeriod: {
      start: string;
      end: string;
    };
    expectedEffects: string;
    salesTarget: {
      year1: number;
      year2: number;
      year3: number;
    };
  };
  evidence: {
    files: File[];
    processedDocuments: any[];
  };
  // Phase 2 Extended Fields
  purposeBackground?: PurposeBackground;
  detailedPlans?: DetailedPlan[];
  kpiTargets?: KpiTarget[];
}

const STEPS = [
  {
    id: 'basic-info',
    title: '基本情報',
    description: '事業者の基本情報を入力',
    icon: Building2,
  },
  {
    id: 'purpose-background',
    title: '目的・背景',
    description: '課題と解決策を入力',
    icon: FileText,
  },
  {
    id: 'detailed-plan',
    title: '取組内容',
    description: '5W1Hで具体化',
    icon: FileText,
  },
  {
    id: 'kpi-targets',
    title: 'KPI設定',
    description: '数値目標を設定',
    icon: FileText,
  },
  {
    id: 'auto-generate',
    title: 'AI自動生成',
    description: 'KPI・計画を自動生成',
    icon: Sparkles,
  },
  {
    id: 'business-plan',
    title: '事業計画',
    description: '補助事業の計画を入力',
    icon: FileText,
  },
  {
    id: 'evidence',
    title: '証拠書類',
    description: '必要書類をアップロード',
    icon: Upload,
  },
  {
    id: 'review',
    title: '確認・送信',
    description: '入力内容を確認',
    icon: CheckCircle,
  },
];

export function ApplicationWizard({ onComplete }: ApplicationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    basicInfo: {
      companyName: '',
      representativeName: '',
      postalCode: '',
      address: '',
      phone: '',
      email: '',
      employeeCount: 0,
      capital: 0,
      establishedYear: new Date().getFullYear(),
      businessType: '',
    },
    businessPlan: {
      projectTitle: '',
      projectDescription: '',
      requestedAmount: 0,
      totalProjectCost: 0,
      implementationPeriod: {
        start: '',
        end: '',
      },
      expectedEffects: '',
      salesTarget: {
        year1: 0,
        year2: 0,
        year3: 0,
      },
    },
    evidence: {
      files: [],
      processedDocuments: [],
    },
    // Phase 2 Extended Fields
    purposeBackground: {
      currentIssues: [],
      painPoints: '',
      rootCause: '',
      solution: '',
      approach: '',
      uniqueValue: '',
    },
    detailedPlans: [],
    kpiTargets: [],
  });

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to login if not authenticated
        router.push('/ja/login?redirectedFrom=/ja/application/new');
      } else {
        setUser(user);
      }
    };

    checkAuth();
  }, [router]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (stepData: any) => {
    const stepId = STEPS[currentStep].id;
    
    const fieldMap: Record<string, string> = {
      'basic-info': 'basicInfo',
      'purpose-background': 'purposeBackground',
      'detailed-plan': 'detailedPlans',
      'kpi-targets': 'kpiTargets',
      'business-plan': 'businessPlan',
      'evidence': 'evidence',
    };
    
    const fieldName = fieldMap[stepId];
    if (fieldName) {
      setApplicationData(prev => ({
        ...prev,
        [fieldName]: stepData,
      }));
    }

    if (currentStep === STEPS.length - 1) {
      // Final step - submit application
      handleSubmit();
    } else {
      handleNext();
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push('/ja/login?redirectedFrom=/ja/application/new');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get auth token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      // Create application via backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: applicationData.businessPlan.projectTitle || '新規申請',
          locale: 'ja',
          status: 'DRAFT',
          // Additional application data can be added here
          metadata: applicationData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create application');
      }

      const result = await response.json();
      onComplete(result.data.id);
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('申請の作成に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'basic-info':
        return (
          <BasicInfoStep
            data={applicationData.basicInfo}
            onComplete={handleStepComplete}
          />
        );
      case 'purpose-background':
        return (
          <PurposeBackgroundStep
            data={applicationData.purposeBackground || {
              currentIssues: [],
              painPoints: '',
              solution: '',
              approach: '',
            }}
            onComplete={handleStepComplete}
          />
        );
      case 'detailed-plan':
        return (
          <DetailedPlanStep
            data={applicationData.detailedPlans || []}
            onComplete={handleStepComplete}
          />
        );
      case 'kpi-targets':
        return (
          <KPITargetStep
            data={applicationData.kpiTargets || []}
            onComplete={handleStepComplete}
          />
        );
      case 'auto-generate':
        // Use mock application ID for now
        const mockAppId = `app_demo_${Date.now()}`;
        return (
          <div>
            <AutoPlanForm applicationId={mockAppId} />
            <div className="mt-4 flex justify-end">
              <Button onClick={handleNext}>次へ進む</Button>
            </div>
          </div>
        );
      case 'business-plan':
        return (
          <BusinessPlanStep
            data={applicationData.businessPlan}
            onComplete={handleStepComplete}
          />
        );
      case 'evidence':
        return (
          <EvidenceUploadStep
            data={applicationData.evidence}
            onComplete={handleStepComplete}
          />
        );
      case 'review':
        return (
          <ReviewStep
            data={applicationData}
            onComplete={handleStepComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>ステップ {currentStep + 1} / {STEPS.length}</span>
          <span>{Math.round(progress)}% 完了</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div
              key={step.id}
              className={`flex flex-col items-center space-y-2 ${
                index !== STEPS.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div className="flex items-center w-full">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    ${isActive ? 'bg-primary text-white' : 
                      isCompleted ? 'bg-green-600 text-white' : 
                      'bg-gray-200 dark:bg-gray-700 text-gray-500'}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {index !== STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 hidden md:block">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          前へ
        </Button>

        {currentStep < STEPS.length - 1 && (
          <Button onClick={() => {
            // Validate current step before proceeding
            const stepContent = document.querySelector('form');
            if (stepContent) {
              stepContent.dispatchEvent(new Event('submit', { bubbles: true }));
            }
          }}>
            次へ
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}