'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icons } from '@/components/ui/icons'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registered = searchParams.get('registered')

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Sign in with email and password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        // Handle specific error messages
        if (signInError.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('メールアドレスの確認が必要です。確認メールをご確認ください。')
        } else {
          setError(signInError.message || 'ログインに失敗しました')
        }
        return
      }

      if (data?.user) {
        // Successful login - redirect to dashboard
        const redirectTo = searchParams.get('redirectedFrom') || '/ja/applications'
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError('ログイン中にエラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            ログイン
          </CardTitle>
          <CardDescription className="text-center">
            補助金申請システムにログイン
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {registered && (
              <Alert className="alert">
                <AlertDescription>
                  アカウントを作成しました。ログインしてください。
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                placeholder="パスワードを入力"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="text-sm text-right">
              <Link href="/ja/forgot-password" className="text-primary hover:underline">
                パスワードをお忘れですか？
              </Link>
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
              ログイン
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              アカウントをお持ちでない方は{' '}
              <Link href="/ja/signup" className="text-primary hover:underline">
                新規登録
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}