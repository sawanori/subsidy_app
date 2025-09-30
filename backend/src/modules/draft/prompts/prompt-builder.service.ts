import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  buildRAGPrompt(template: any, project: any): string {
    const requirements = template.requirements;
    const systemPrompt = this.getSystemPrompt();
    const examples = this.getFewShotExamples(template.schemeId);
    const userContext = this.buildUserContext(template, project, requirements);
    const outputFormat = this.getOutputFormat(requirements);
    return systemPrompt + '\n\n' + examples + '\n\n' + userContext + '\n\n' + outputFormat;
  }

  private getSystemPrompt(): string {
    return 'You are a subsidy application consultant with expertise in writing successful applications.';
  }

  private getFewShotExamples(schemeId: string): string {
    if (schemeId === 'jizokuka-2025-v1') {
      return 'Example: Our company is a restaurant in Tokyo...';
    }
    return 'General writing tips: Use data, cite sources, set SMART goals.';
  }

  private buildUserContext(template: any, project: any, requirements: any): string {
    return 'Your mission: Generate a high-quality application draft.\n' +
           'Scheme: ' + template.name + '\n' +
           'Goal: ' + project.goal + '\n' +
           'Constraints: ' + JSON.stringify(project.constraints) + '\n' +
           'Budget max: ' + requirements.budget.maxTotal + '\n' +
           'Subsidy rate: ' + (requirements.budget.subsidyRate * 100) + '%';
  }

  private getOutputFormat(requirements: any): string {
    return 'Output format: JSON with sections: background, problemSolution, plan5w1h, kpi, roadmap, budget, team, risks, differentiation';
  }

  private formatSectionRequirements(sections: any[]): string {
    return sections.map(s => s.name).join(', ');
  }

  private formatCurrency(amount: number): string {
    return amount.toLocaleString() + ' yen';
  }

  calculatePromptQuality(prompt: string): { score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 100;
    if (prompt.length < 500) {
      score -= 20;
      feedback.push('Prompt too short');
    }
    return { score, feedback };
  }
}
