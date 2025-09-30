'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Edit2, Save, X } from 'lucide-react';

interface KPI {
  name: string;
  baseline?: number;
  target: number;
  unit: string;
  method: string;
  frequency: string;
  rationale?: string;
  sourceRef?: string;
}

interface EditableKPICardProps {
  kpi: KPI;
  index: number;
  onUpdate: (index: number, kpi: KPI) => void;
}

export function EditableKPICard({ kpi, index, onUpdate }: EditableKPICardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedKpi, setEditedKpi] = useState<KPI>(kpi);

  const handleSave = () => {
    onUpdate(index, editedKpi);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedKpi(kpi);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Input
              value={editedKpi.name}
              onChange={(e) => setEditedKpi({ ...editedKpi, name: e.target.value })}
              className="text-lg font-semibold"
              placeholder="KPI名"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleSave}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">現状値</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  value={editedKpi.baseline ?? ''}
                  onChange={(e) => setEditedKpi({
                    ...editedKpi,
                    baseline: e.target.value ? Number(e.target.value) : undefined
                  })}
                  placeholder="未測定"
                />
                <Input
                  value={editedKpi.unit}
                  onChange={(e) => setEditedKpi({ ...editedKpi, unit: e.target.value })}
                  className="w-20"
                  placeholder="単位"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">目標値</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  value={editedKpi.target}
                  onChange={(e) => setEditedKpi({
                    ...editedKpi,
                    target: Number(e.target.value)
                  })}
                  required
                />
                <span className="w-20 p-2 text-sm">{editedKpi.unit}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">測定方法</Label>
              <Input
                value={editedKpi.method}
                onChange={(e) => setEditedKpi({ ...editedKpi, method: e.target.value })}
                placeholder="例: GA4"
              />
            </div>

            <div>
              <Label className="text-xs">測定頻度</Label>
              <Input
                value={editedKpi.frequency}
                onChange={(e) => setEditedKpi({ ...editedKpi, frequency: e.target.value })}
                placeholder="例: monthly"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">根拠・理由</Label>
            <Input
              value={editedKpi.rationale ?? ''}
              onChange={(e) => setEditedKpi({ ...editedKpi, rationale: e.target.value })}
              placeholder="このKPIを選んだ理由"
            />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="font-semibold">{kpi.name}</h4>
          <div className="flex gap-2">
            <Badge variant="outline">{kpi.method}</Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">現状: </span>
            {kpi.baseline ?? '未測定'} {kpi.unit}
          </div>
          <div>
            <span className="text-muted-foreground">目標: </span>
            <span className="font-semibold text-green-600">
              {kpi.target} {kpi.unit}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">頻度: </span>
            {kpi.frequency}
          </div>
        </div>

        {kpi.rationale && (
          <p className="text-sm text-muted-foreground">{kpi.rationale}</p>
        )}

        {kpi.baseline !== undefined && kpi.baseline !== null && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (kpi.target / kpi.baseline) * 100 - 100)}%`
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              +{Math.round((kpi.target / kpi.baseline - 1) * 100)}%
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}