'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Upload,
  FileText,
  Info,
} from 'lucide-react';
import { UploadFromTaxReturnModal } from '../intake/upload-from-tax-return-modal';
import { UploadFromTeihonModal } from '../intake/upload-from-teihon-modal';
import { ExtractResponse } from '@/lib/api/types';

interface ApplicantData {
  type: 'individual' | 'corporate';
  // 共通
  name?: string;
  address?: string;
  postalCode?: string;
  phoneNumber?: string;
  email?: string;
  // 個人事業主
  businessName?: string;
  // 法人
  companyName?: string;
  representative?: string;
  establishedDate?: string;
  capital?: number;
  employeeCount?: number;
  businessDescription?: string;
}

interface ApplicantCardProps {
  data?: ApplicantData;
  onChange: (data: ApplicantData) => void;
  onValidate?: () => Promise<boolean>;
}

export function ApplicantCard({ data, onChange, onValidate }: ApplicantCardProps) {
  const [applicantType, setApplicantType] = useState<'individual' | 'corporate'>(
    data?.type || 'individual'
  );
  const [formData, setFormData] = useState<ApplicantData>(data || { type: 'individual' });
  const [showTaxReturnModal, setShowTaxReturnModal] = useState(false);
  const [showTeihonModal, setShowTeihonModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
    // エラーをクリア
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (type: 'individual' | 'corporate') => {
    setApplicantType(type);
    const newData = { ...formData, type };
    setFormData(newData);
    onChange(newData);
  };

  const handleExtractComplete = (extractData: ExtractResponse) => {
    const fields = extractData.extracted_fields;
    const newData: ApplicantData = { ...formData };

    // 共通フィールド
    if (fields.address) newData.address = fields.address;
    if (fields.phoneNumber || fields.phone) newData.phoneNumber = fields.phoneNumber || fields.phone;
    if (fields.email) newData.email = fields.email;

    // 個人事業主
    if (applicantType === 'individual') {
      if (fields.name) newData.name = fields.name;
      if (fields.businessName || fields.companyName) newData.businessName = fields.businessName || fields.companyName;
    }
    // 法人
    else {
      if (fields.companyName || fields.corporateName || fields.name) newData.companyName = fields.companyName || fields.corporateName || fields.name;
      if (fields.representativeName || fields.representative || fields.name) newData.representative = fields.representativeName || fields.representative || fields.name;
      if (fields.establishedDate) newData.establishedDate = fields.establishedDate;
      if (fields.capital != null) newData.capital = typeof fields.capital === 'number' ? fields.capital : parseInt(fields.capital) || 0;
      if (fields.employeeCount != null || fields.employees != null) newData.employeeCount = typeof (fields.employeeCount ?? fields.employees) === 'number' ? (fields.employeeCount ?? fields.employees) : parseInt(fields.employeeCount ?? fields.employees) || 0;
    }

    setFormData(newData);
    onChange(newData);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 共通の必須項目
    if (!formData.address) newErrors.address = '住所は必須です';
    if (!formData.phoneNumber) newErrors.phoneNumber = '電話番号は必須です';
    if (!formData.email) newErrors.email = 'メールアドレスは必須です';

    if (applicantType === 'individual') {
      if (!formData.name) newErrors.name = '氏名は必須です';
    } else {
      if (!formData.companyName) newErrors.companyName = '会社名は必須です';
      if (!formData.representative) newErrors.representative = '代表者名は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {applicantType === 'individual' ? (
              <User className="h-5 w-5" />
            ) : (
              <Building className="h-5 w-5" />
            )}
            申請者情報
          </CardTitle>
          <CardDescription>
            申請者の基本情報を入力してください。確定申告書や謄本から自動入力も可能です。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 申請者種別 */}
          <div className="space-y-3">
            <Label>申請者種別</Label>
            <RadioGroup value={applicantType} onValueChange={handleTypeChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual">個人事業主</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="corporate" id="corporate" />
                <Label htmlFor="corporate">法人</Label>
              </div>
            </RadioGroup>
          </div>

          {/* データ取り込みボタン */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTaxReturnModal(true)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              確定申告書から入力
            </Button>
            {applicantType === 'corporate' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTeihonModal(true)}
                className="gap-2"
              >
                <Building className="h-4 w-4" />
                謄本から入力
              </Button>
            )}
          </div>

          {/* 個人事業主フォーム */}
          {applicantType === 'individual' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">
                  氏名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="山田 太郎"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="businessName">屋号</Label>
                <Input
                  id="businessName"
                  value={formData.businessName || ''}
                  onChange={(e) => handleFieldChange('businessName', e.target.value)}
                  placeholder="山田商店"
                />
              </div>
            </div>
          )}

          {/* 法人フォーム */}
          {applicantType === 'corporate' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">
                  会社名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName || ''}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                  placeholder="株式会社山田商事"
                  className={errors.companyName ? 'border-destructive' : ''}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive mt-1">{errors.companyName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="representative">
                  代表者名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="representative"
                  value={formData.representative || ''}
                  onChange={(e) => handleFieldChange('representative', e.target.value)}
                  placeholder="山田 太郎"
                  className={errors.representative ? 'border-destructive' : ''}
                />
                {errors.representative && (
                  <p className="text-sm text-destructive mt-1">{errors.representative}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="establishedDate">設立年月日</Label>
                  <Input
                    id="establishedDate"
                    type="date"
                    value={formData.establishedDate || ''}
                    onChange={(e) => handleFieldChange('establishedDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="capital">資本金（円）</Label>
                  <Input
                    id="capital"
                    type="number"
                    value={formData.capital || ''}
                    onChange={(e) => handleFieldChange('capital', parseInt(e.target.value))}
                    placeholder="10000000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="employeeCount">従業員数</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  value={formData.employeeCount || ''}
                  onChange={(e) => handleFieldChange('employeeCount', parseInt(e.target.value))}
                  placeholder="10"
                />
              </div>
            </div>
          )}

          {/* 共通フィールド */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="postalCode">郵便番号</Label>
              <Input
                id="postalCode"
                value={formData.postalCode || ''}
                onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                placeholder="100-0001"
              />
            </div>

            <div>
              <Label htmlFor="address">
                住所 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="東京都千代田区千代田1-1"
                className={errors.address ? 'border-destructive' : ''}
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber">
                  電話番号 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                  placeholder="03-1234-5678"
                  className={errors.phoneNumber ? 'border-destructive' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">
                  メールアドレス <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="info@example.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            {applicantType === 'corporate' && (
              <div>
                <Label htmlFor="businessDescription">事業内容</Label>
                <textarea
                  id="businessDescription"
                  value={formData.businessDescription || ''}
                  onChange={(e) => handleFieldChange('businessDescription', e.target.value)}
                  placeholder="ソフトウェアの開発・販売"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={3}
                />
              </div>
            )}
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <span className="text-destructive">*</span> は必須項目です。
              申請書の作成には正確な情報が必要です。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* モーダル */}
      <UploadFromTaxReturnModal
        isOpen={showTaxReturnModal}
        onClose={() => setShowTaxReturnModal(false)}
        onExtractComplete={handleExtractComplete}
      />
      <UploadFromTeihonModal
        isOpen={showTeihonModal}
        onClose={() => setShowTeihonModal(false)}
        onExtractComplete={handleExtractComplete}
      />
    </>
  );
}
