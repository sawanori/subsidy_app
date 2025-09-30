'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProjectForm } from './ProjectForm';
import { DraftGenerationUI } from './DraftGenerationUI';
import { DraftVersionList } from './DraftVersionList';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

/**
 * DraftWizard - IH¶£∂¸…≥Û›¸ÕÛ»
 *
 * ’Ì¸:
 * 1. ◊Ì∏ßØ»\Ó64«#	
 * 2. IHRAGüL	
 * 3. H°˚Ë∆
 */

interface DraftWizardProps {
  schemeId?: string;
  onComplete?: (draftId: string) => void;
}

type WizardStep = 'project' | 'generate' | 'versions';

interface StepConfig {
  id: WizardStep;
  label: string;
  description: string;
}

const steps: StepConfig[] = [
  {
    id: 'project',
    label: '◊Ì∏ßØ»\',
    description: 'Óh6aˆíeõ',
  },
  {
    id: 'generate',
    label: 'IH',
    description: 'AIIHíÍ’',
  },
  {
    id: 'versions',
    label: 'H°',
    description: 'IHn∫çhË∆',
  },
];

export const DraftWizard: React.FC<DraftWizardProps> = ({
  schemeId = 'jizokuka-2025-v1',
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('project');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleProjectCreated = (newProjectId: string) => {
    setProjectId(newProjectId);
    setCompletedSteps([...completedSteps, 'project']);
    setCurrentStep('generate');
  };

  const handleDraftGenerated = (newDraftId: string) => {
    setDraftId(newDraftId);
    setCompletedSteps([...completedSteps, 'generate']);
    setCurrentStep('versions');
  };

  const handleComplete = () => {
    if (draftId && onComplete) {
      onComplete(draftId);
    }
  };

  const isStepCompleted = (stepId: WizardStep) => completedSteps.includes(stepId);
  const isStepActive = (stepId: WizardStep) => currentStep === stepId;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">IHÍ’</h1>
        <p className="text-muted-foreground">
          AI í(Wf‹©—3À¯nIHíÍ’W~Y
        </p>
      </div>

      {/* Progress Bar */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">2W</span>
              <span className="text-sm text-muted-foreground">
                π∆√◊ {currentStepIndex + 1} / {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const completed = isStepCompleted(step.id);
              const active = isStepActive(step.id);

              return (
                <div
                  key={step.id}
                  className={`flex-1 ${index !== steps.length - 1 ? 'border-r' : ''}`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {completed ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : active ? (
                      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  <div className="text-center px-2">
                    <p
                      className={`text-sm font-medium ${
                        active ? 'text-blue-600' : completed ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Tabs value={currentStep} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          {steps.map((step) => (
            <TabsTrigger
              key={step.id}
              value={step.id}
              disabled={!isStepCompleted(step.id) && !isStepActive(step.id)}
            >
              {step.label}
              {isStepCompleted(step.id) && (
                <Badge variant="secondary" className="ml-2">
                  åÜ
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Step 1: Project Form */}
        <TabsContent value="project">
          <ProjectForm schemeId={schemeId} onProjectCreated={handleProjectCreated} />
        </TabsContent>

        {/* Step 2: Draft Generation */}
        <TabsContent value="generate">
          {projectId ? (
            <DraftGenerationUI
              projectId={projectId}
              schemeId={schemeId}
              onDraftGenerated={handleDraftGenerated}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>◊Ì∏ßØ»LxûUåfD~[ì</CardTitle>
                <CardDescription>
                  ~Z◊Ì∏ßØ»í\WfO`UD
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        {/* Step 3: Draft Versions */}
        <TabsContent value="versions">
          {projectId ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>IHH°</CardTitle>
                  <CardDescription>
                    Uå_IHí∫ç˚Ë∆gM~Y
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DraftVersionList projectId={projectId} currentDraftId={draftId} />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleComplete} size="lg">
                  åÜ
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>◊Ì∏ßØ»LxûUåfD~[ì</CardTitle>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};