'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Application {
  id: string
  title: string
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  submittedAt?: string
  amount?: number
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoadApplications()
  }, [])

  const checkAuthAndLoadApplications = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/ja/login')
      return
    }

    setUser(user)
    await loadApplications()
  }

  const loadApplications = async () => {
    try {
      // TODO: Fetch from backend API
      // For now, use mock data
      const mockApplications: Application[] = [
        {
          id: '1',
          title: '令和6年度 小規模事業者持続化補助金申請',
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          amount: 500000,
        },
        {
          id: '2',
          title: 'IT導入補助金申請書',
          status: 'SUBMITTED',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 1000000,
        },
      ]

      setApplications(mockApplications)
    } catch (error) {
      console.error('Failed to load applications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('この申請を削除してもよろしいですか？')) {
      // TODO: Implement delete
      console.log('Delete:', id)
    }
  }

  const getStatusBadge = (status: Application['status']) => {
    const statusConfig = {
      DRAFT: { label: '下書き', variant: 'secondary' as const },
      SUBMITTED: { label: '提出済み', variant: 'default' as const },
      APPROVED: { label: '承認済み', variant: 'default' as const },
      REJECTED: { label: '却下', variant: 'destructive' as const },
    }

    const config = statusConfig[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">読み込み中...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">申請管理</h1>
              <p className="text-muted-foreground mt-2">
                補助金申請の作成と管理
              </p>
            </div>
            <Button onClick={() => router.push('/ja/application/new')}>
              <Plus className="mr-2 h-4 w-4" />
              新規申請
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  全申請数
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{applications.length}</div>
                <p className="text-xs text-muted-foreground">
                  作成済みの申請書
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  下書き
                </CardTitle>
                <Edit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {applications.filter(a => a.status === 'DRAFT').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  編集中の申請
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  提出済み
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {applications.filter(a => a.status === 'SUBMITTED').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  提出済みの申請
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  申請総額
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(applications.reduce((sum, a) => sum + (a.amount || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  申請金額の合計
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle>申請一覧</CardTitle>
              <CardDescription>
                作成した申請書の一覧です。詳細を確認または編集できます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">申請がありません</h3>
                  <p className="mt-2 text-muted-foreground">
                    新しい申請を作成してください
                  </p>
                  <Button
                    onClick={() => router.push('/ja/application/new')}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    最初の申請を作成
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>タイトル</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>申請金額</TableHead>
                      <TableHead>作成日</TableHead>
                      <TableHead>更新日</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">
                          {application.title}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(application.status)}
                        </TableCell>
                        <TableCell>{formatAmount(application.amount)}</TableCell>
                        <TableCell>{formatDate(application.createdAt)}</TableCell>
                        <TableCell>{formatDate(application.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>アクション</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => router.push(`/ja/application/${application.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                詳細を見る
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/ja/application/${application.id}/edit`)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                編集
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                ダウンロード
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(application.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                削除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}