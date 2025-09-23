'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const basicInfoSchema = z.object({
  companyName: z.string().min(1, '会社名を入力してください'),
  representativeName: z.string().min(1, '代表者名を入力してください'),
  postalCode: z.string().regex(/^\d{3}-?\d{4}$/, '正しい郵便番号を入力してください'),
  address: z.string().min(1, '住所を入力してください'),
  phone: z.string().regex(/^[\d-]+$/, '正しい電話番号を入力してください'),
  email: z.string().email('正しいメールアドレスを入力してください'),
  employeeCount: z.number().min(0, '従業員数は0以上の数値を入力してください'),
  capital: z.number().min(0, '資本金は0以上の数値を入力してください'),
  establishedYear: z.number().min(1900).max(new Date().getFullYear()),
  businessType: z.string().min(1, '業種を選択してください'),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

interface BasicInfoStepProps {
  data: BasicInfoFormData;
  onComplete: (data: BasicInfoFormData) => void;
}

const BUSINESS_TYPES = [
  { value: 'manufacturing', label: '製造業' },
  { value: 'wholesale', label: '卸売業' },
  { value: 'retail', label: '小売業' },
  { value: 'service', label: 'サービス業' },
  { value: 'construction', label: '建設業' },
  { value: 'it', label: '情報通信業' },
  { value: 'restaurant', label: '飲食業' },
  { value: 'other', label: 'その他' },
];

export function BasicInfoStep({ data, onComplete }: BasicInfoStepProps) {
  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: data,
  });

  const onSubmit = (formData: BasicInfoFormData) => {
    onComplete(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>会社名・屋号 *</FormLabel>
                <FormControl>
                  <Input placeholder="株式会社サンプル" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="representativeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>代表者名 *</FormLabel>
                <FormControl>
                  <Input placeholder="山田 太郎" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>郵便番号 *</FormLabel>
                <FormControl>
                  <Input placeholder="123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>住所 *</FormLabel>
                <FormControl>
                  <Input placeholder="東京都千代田区..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>電話番号 *</FormLabel>
                <FormControl>
                  <Input placeholder="03-1234-5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>メールアドレス *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="info@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employeeCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>従業員数 *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="5" 
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capital"
            render={({ field }) => (
              <FormItem>
                <FormLabel>資本金（万円） *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1000" 
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="establishedYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>設立年 *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="2020" 
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>業種 *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="業種を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUSINESS_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">次へ進む</Button>
        </div>
      </form>
    </Form>
  );
}