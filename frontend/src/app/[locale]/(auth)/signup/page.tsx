'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icons } from '@/components/ui/icons'

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    accountName: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('パスワードは8文字以上で設定してください')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Sign up with email and password
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            account_name: formData.accountName,
          },
        }
      })

      if (signUpError) {
        // Handle specific error cases
        if (signUpError.message.includes('User already registered')) {
          setError('このメールアドレスは既に登録されています')
        } else {
          setError(signUpError.message || 'アカウント作成に失敗しました')
        }
        return
      }

      if (data?.user) {
        // Try to create user record in database (non-blocking)
        fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.user.id,
            email: formData.email,
            accountName: formData.accountName
          })
        }).catch(err => {
          console.warn('Failed to sync with database:', err)
        })

        setSuccess(true)

        // Show success message and redirect
        setTimeout(() => {
          router.push('/ja/login?registered=true')
        }, 1500)
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError('アカウント作成中にエラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            アカウント作成
          </CardTitle>
          <CardDescription className="text-center">
            補助金申請システムのアカウントを作成します
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="alert">
                <AlertDescription>
                  アカウントを作成しました。確認メールをご確認ください。
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="accountName">アカウント名</Label>
              <Input
                id="accountName"
                type="text"
                placeholder="株式会社サンプル"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="8文字以上で入力"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="パスワードを再入力"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              アカウントを作成
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              既にアカウントをお持ちですか？{' '}
              <Link href="/ja/login" className="text-primary hover:underline">
                ログイン
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}