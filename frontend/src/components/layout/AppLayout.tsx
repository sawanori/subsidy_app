'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import SkipLinks from '@/components/a11y/SkipLinks';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { KeyboardNavigation } from '@/components/navigation/KeyboardNavigation';
import { Button } from '@/components/ui/button';
import { FileText, Home, FolderOpen, HelpCircle, Settings, LogOut, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => subscription.unsubscribe();
    };

    checkUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/ja/login');
  };

  const isActive = (path: string) => {
    return pathname.includes(path);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <SkipLinks />
      
      <header 
        className="bg-card border-b border-border sticky top-0 z-50"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/ja" className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">
                  小規模事業者持続化補助金 申請支援システム
                </h1>
              </Link>
              
              <nav 
                id="main-navigation"
                role="navigation"
                aria-label={t('navigation.mainMenu')}
                className="hidden md:block"
              >
                <KeyboardNavigation orientation="horizontal">
                  <Link 
                    href="/ja"
                    className={`
                      px-3 py-2 text-sm font-medium rounded-md transition-colors min-target
                      ${pathname === '/ja' 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
                    `}
                  >
                    <Home className="inline-block h-4 w-4 mr-1" />
                    ホーム
                  </Link>
                  <Link 
                    href="/ja/applications"
                    className={`
                      px-3 py-2 text-sm font-medium rounded-md transition-colors min-target
                      ${isActive('/applications') 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
                    `}
                  >
                    <FolderOpen className="inline-block h-4 w-4 mr-1" />
                    申請管理
                  </Link>
                  <Link 
                    href="/ja/help"
                    className={`
                      px-3 py-2 text-sm font-medium rounded-md transition-colors min-target
                      ${isActive('/help') 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
                    `}
                  >
                    <HelpCircle className="inline-block h-4 w-4 mr-1" />
                    ヘルプ
                  </Link>
                </KeyboardNavigation>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    asChild
                  >
                    <Link href="/ja/application/new">
                      <FileText className="h-4 w-4 mr-2" />
                      新規申請
                    </Link>
                  </Button>

                  <div className="flex items-center space-x-2 border-l pl-4">
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" title={user.email}>
                      <User className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleLogout} title="ログアウト">
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href="/ja/login">
                      ログイン
                    </Link>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    asChild
                  >
                    <Link href="/ja/signup">
                      新規登録
                    </Link>
                  </Button>
                  <div className="flex items-center space-x-2 border-l pl-4">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main 
        id="main-content"
        role="main"
        className="flex-1"
      >
        {children}
      </main>

      <footer 
        id="footer"
        role="contentinfo"
        className="bg-muted text-muted-foreground mt-auto"
      >
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <h3 className="font-semibold mb-3">サービス</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/ja/application/new" className="hover:text-foreground">新規申請作成</Link></li>
                <li><Link href="/ja/applications" className="hover:text-foreground">申請管理</Link></li>
                <li><Link href="/ja/templates" className="hover:text-foreground">テンプレート</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">サポート</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/ja/help" className="hover:text-foreground">ヘルプセンター</Link></li>
                <li><Link href="/ja/guide" className="hover:text-foreground">申請ガイド</Link></li>
                <li><Link href="/ja/faq" className="hover:text-foreground">よくある質問</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">法的情報</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/ja/privacy" className="hover:text-foreground">プライバシーポリシー</Link></li>
                <li><Link href="/ja/terms" className="hover:text-foreground">利用規約</Link></li>
                <li><Link href="/ja/security" className="hover:text-foreground">セキュリティ</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6">
            <p className="text-center text-sm">
              © 2025 小規模事業者持続化補助金 申請支援システム. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;