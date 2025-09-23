'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';

export default function UIWidthTestPage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Test Header */}
          <section className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              UI Width Verification Test
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Testing UI component layouts with various text lengths
            </p>
          </section>

          {/* Buttons Test */}
          <Card>
            <CardHeader>
              <CardTitle>Button Width Tests</CardTitle>
              <CardDescription>Various button sizes with different text lengths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="default">
                  {t('common.submit')}
                </Button>
                <Button variant="secondary">
                  {t('common.cancel')}
                </Button>
                <Button variant="destructive">
                  {t('common.delete')}
                </Button>
                <Button variant="outline">
                  {t('subsidy.search')}
                </Button>
                <Button variant="ghost">
                  {t('subsidy.apply')}
                </Button>
                <Button variant="link">
                  {t('subsidy.details')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Test */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation Width Tests</CardTitle>
              <CardDescription>Testing navigation items with varying lengths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Badge variant="default">{t('navigation.home')}</Badge>
                <Badge variant="secondary">{t('navigation.dashboard')}</Badge>
                <Badge variant="outline">{t('navigation.subsidies')}</Badge>
                <Badge variant="destructive">{t('navigation.applications')}</Badge>
                <Badge variant="default">{t('navigation.profile')}</Badge>
                <Badge variant="secondary">{t('navigation.settings')}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements Test */}
          <Card>
            <CardHeader>
              <CardTitle>Form Elements Width Tests</CardTitle>
              <CardDescription>Testing form fields with long labels and placeholders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="required-field">
                      {t('form.required')} - {t('subsidy.title')}
                    </Label>
                    <Input 
                      id="required-field"
                      placeholder={t('form.invalidEmail')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="optional-field">
                      {t('form.optional')} - {t('subsidy.requirements')}
                    </Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={t('subsidy.category')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">{t('subsidy.status')}</SelectItem>
                        <SelectItem value="option2">{t('subsidy.deadline')}</SelectItem>
                        <SelectItem value="option3">{t('subsidy.amount')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('subsidy.description')}
                  </Label>
                  <Textarea 
                    id="description"
                    placeholder={t('form.tooLong', { max: '500' })}
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Messages Test */}
          <Card>
            <CardHeader>
              <CardTitle>Error Messages Width Tests</CardTitle>
              <CardDescription>Testing various error message lengths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <p className="text-red-600 font-medium">{t('errors.notFound')}</p>
                </div>
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <p className="text-red-600 font-medium">{t('errors.unauthorized')}</p>
                </div>
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <p className="text-red-600 font-medium">{t('errors.validationError')}</p>
                </div>
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <p className="text-red-600 font-medium">{t('form.tooShort', { min: '10' })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Labels Test */}
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Labels Width Tests</CardTitle>
              <CardDescription>Testing screen reader and accessibility text lengths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button aria-label={t('accessibility.toggleTheme')}>
                    🎨 Theme
                  </Button>
                  <Button aria-label={t('accessibility.toggleLanguage')}>
                    🌐 Language
                  </Button>
                  <Button aria-label={t('accessibility.expandMenu')}>
                    ☰ Menu
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Skip Links:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>{t('navigation.skipToContent')}</li>
                      <li>{t('navigation.skipToNavigation')}</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Status Messages:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>{t('form.uploadSuccess')}</li>
                      <li>{t('form.uploadError')}</li>
                      <li>{t('errors.sessionExpired')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layout Stress Test */}
          <Card>
            <CardHeader>
              <CardTitle>Layout Stress Test</CardTitle>
              <CardDescription>Testing extreme text lengths in constrained layouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold truncate">{t('subsidy.title')}</h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{t('subsidy.description')}</p>
                  <Button size="sm" className="mt-4 w-full">
                    {t('subsidy.apply')}
                  </Button>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold truncate">{t('form.invalidEmail')}</h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{t('form.tooLong', { max: '1000' })}</p>
                  <Button size="sm" className="mt-4 w-full">
                    {t('common.confirm')}
                  </Button>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold truncate">{t('accessibility.skipToNavigation')}</h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{t('errors.genericError')}</p>
                  <Button size="sm" className="mt-4 w-full">
                    {t('common.close')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}