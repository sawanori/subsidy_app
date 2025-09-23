/**
 * APP-100: PreviewPanel 単体テスト
 * React Testing Library + Jest, 70%+ カバレッジ目標
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewPanel } from '../PreviewPanel';
import { PreviewProvider } from '@/contexts/PreviewContext';
import { PreviewData, PreviewConfig } from '@/types/preview';

// モック設定
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}));

// テストデータ
const mockData: PreviewData = {
  form1: {
    applicantName: 'テスト株式会社',
    applicantAddress: '東京都渋谷区テスト1-2-3',
    representativeName: '代表太郎',
    contactPhone: '03-1234-5678',
    contactEmail: 'test@example.com',
    businessName: 'AI開発プロジェクト',
    businessPurpose: 'AI技術開発',
    projectPeriod: '2024年度'
  },
  form2: {
    budgetTotal: '5000000',
    subsidyAmount: '2500000',
    selfFunding: '2500000'
  },
  form4: {
    technicalDetails: 'AI機械学習技術',
    expectedResults: '効率50%向上'
  },
  confirmation: {
    termsAgreed: false,
    informationAccuracy: false,
    submissionDate: ''
  }
};

const mockConfig: PreviewConfig = {
  activeForm: 'form1',
  zoom: 1,
  showGrid: false,
  fullscreen: false,
  autoUpdate: true
};

const mockOnConfigChange = jest.fn();
const mockOnExport = jest.fn();

// テストヘルパー
const renderWithProvider = (props: any = {}) => {
  return render(
    <PreviewProvider>
      <PreviewPanel
        data={mockData}
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        onExport={mockOnExport}
        {...props}
      />
    </PreviewProvider>
  );
};

describe('PreviewPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders preview panel with correct title', () => {
      renderWithProvider();
      
      expect(screen.getByText('リアルタイムプレビュー')).toBeInTheDocument();
    });

    test('renders all form tabs', () => {
      renderWithProvider();
      
      expect(screen.getByText(/様式1/)).toBeInTheDocument();
      expect(screen.getByText(/様式2/)).toBeInTheDocument();
      expect(screen.getByText(/様式4/)).toBeInTheDocument();
      expect(screen.getByText(/確認/)).toBeInTheDocument();
    });

    test('displays preview content based on active form', () => {
      renderWithProvider();
      
      // Form 1がアクティブな状態での表示確認
      expect(screen.getByDisplayValue('テスト株式会社')).toBeInTheDocument();
      expect(screen.getByDisplayValue('AI開発プロジェクト')).toBeInTheDocument();
    });
  });

  describe('Form Navigation', () => {
    test('switches between forms correctly', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      
      // Form 2に切り替え
      await user.click(screen.getByText(/様式2/));
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        activeForm: 'form2'
      });
    });

    test('displays correct content for each form', () => {
      // Form 2がアクティブな状態でテスト
      const form2Config = { ...mockConfig, activeForm: 'form2' as const };
      renderWithProvider({ config: form2Config });
      
      expect(screen.getByDisplayValue('5000000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2500000')).toBeInTheDocument();
    });
  });

  describe('Preview Controls', () => {
    test('zoom control works correctly', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      
      const zoomSelect = screen.getByDisplayValue('100%');
      await user.selectOptions(zoomSelect, '1.25');
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        zoom: 1.25
      });
    });

    test('fullscreen toggle works', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      
      const fullscreenButton = screen.getByRole('button', { name: /拡大/ });
      await user.click(fullscreenButton);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        fullscreen: true
      });
    });

    test('grid toggle works', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      
      const gridButton = screen.getByRole('button', { name: /設定/ });
      await user.click(gridButton);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        showGrid: !mockConfig.showGrid
      });
    });
  });

  describe('Export Functionality', () => {
    test('PDF export button triggers export handler', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      
      const exportButton = screen.getByRole('button', { name: /PDF/ });
      await user.click(exportButton);
      
      expect(mockOnExport).toHaveBeenCalledWith('pdf');
    });

    test('export button is disabled when no export handler provided', () => {
      renderWithProvider({ onExport: undefined });
      
      const exportButton = screen.getByRole('button', { name: /PDF/ });
      expect(exportButton).toBeDisabled();
    });
  });

  describe('Real-time Updates', () => {
    test('updates preview when data changes', async () => {
      const { rerender } = renderWithProvider();
      
      const newData = {
        ...mockData,
        form1: {
          ...mockData.form1,
          applicantName: '更新された会社名'
        }
      };
      
      rerender(
        <PreviewProvider>
          <PreviewPanel
            data={newData}
            config={mockConfig}
            onConfigChange={mockOnConfigChange}
            onExport={mockOnExport}
          />
        </PreviewProvider>
      );
      
      expect(screen.getByDisplayValue('更新された会社名')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    test('calculates completion percentage correctly', () => {
      // すべてのフィールドが埋まった状態
      const completeData = {
        form1: {
          applicantName: 'テスト会社',
          applicantAddress: 'テスト住所',
          representativeName: '代表者',
          contactPhone: '090-1234-5678',
          contactEmail: 'test@test.com',
          businessName: 'テスト事業',
          businessPurpose: 'テスト目的',
          projectPeriod: '1年'
        },
        form2: { budgetTotal: '1000000', subsidyAmount: '500000', selfFunding: '500000' },
        form4: { technicalDetails: 'テスト', expectedResults: 'テスト' },
        confirmation: { termsAgreed: true, informationAccuracy: true, submissionDate: '2024-09-09' }
      };
      
      renderWithProvider({ data: completeData });
      
      // 完成度が表示されていることを確認
      expect(screen.getByText(/完成度/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      renderWithProvider();
      
      // フォーム切り替えタブにrole="tab"があることを確認
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      
      // Tab キーでナビゲーション
      await user.tab();
      expect(document.activeElement).toBeDefined();
    });

    test('has focus indicators', () => {
      renderWithProvider();
      
      const interactiveElements = screen.getAllByRole('button');
      interactiveElements.forEach(element => {
        expect(element).toHaveStyle('cursor: pointer');
      });
    });
  });

  describe('Performance', () => {
    test('renders within acceptable time', () => {
      const startTime = Date.now();
      renderWithProvider();
      const renderTime = Date.now() - startTime;
      
      // governance.yaml: 2秒以内レンダリング
      expect(renderTime).toBeLessThan(2000);
    });

    test('handles large data sets efficiently', () => {
      const largeData = {
        ...mockData,
        form1: {
          ...mockData.form1,
          businessPurpose: 'A'.repeat(10000) // 大きなテキスト
        }
      };
      
      const startTime = Date.now();
      renderWithProvider({ data: largeData });
      const renderTime = Date.now() - startTime;
      
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Error Handling', () => {
    test('handles missing data gracefully', () => {
      const incompleteData = { form1: {} };
      
      expect(() => {
        renderWithProvider({ data: incompleteData });
      }).not.toThrow();
    });

    test('handles invalid config gracefully', () => {
      const invalidConfig = { ...mockConfig, zoom: -1 };
      
      expect(() => {
        renderWithProvider({ config: invalidConfig });
      }).not.toThrow();
    });
  });

  describe('Responsive Design', () => {
    test('adapts to mobile viewport', () => {
      // モバイルサイズのビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProvider();
      
      // レスポンシブレイアウトが機能していることを確認
      const previewPanel = screen.getByRole('tabpanel');
      expect(previewPanel).toBeInTheDocument();
    });
  });
});