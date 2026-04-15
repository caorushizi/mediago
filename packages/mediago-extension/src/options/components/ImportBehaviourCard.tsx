import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ExtensionSettings } from "@/shared/types";

import { useImportBehaviour } from "../use-import-behaviour";

export function ImportBehaviourCard() {
  const { settings, patch } = useImportBehaviour();
  const disabled = settings === null;
  const downloadNow = settings?.downloadNow ?? false;
  const schemaSilent = settings?.schemaSilent ?? true;
  const schemaOnly = settings?.mode === "desktop-schema";

  const apply = async (update: Partial<ExtensionSettings>) => {
    const ok = await patch(update);
    if (ok) toast.success("已保存");
    else toast.error("保存失败");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>导入行为</CardTitle>
        <CardDescription>
          这些选项通过 deeplink 查询串（<code>silent</code> /{" "}
          <code>downloadNow</code>）或 HTTP body（
          <code>startDownload</code>）告诉 MediaGo 收到任务后怎么处理。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToggleRow
          label="立即开始下载"
          description="开：任务进队列并立刻开跑。关：仅加入下载列表，等用户手动触发。对 Schema 和 HTTP 两种模式都生效。"
          checked={downloadNow}
          disabled={disabled}
          onCheckedChange={(v) => apply({ downloadNow: v })}
        />

        <ToggleRow
          label="静默导入（Schema 模式）"
          description={
            schemaOnly
              ? "开：deeplink 携带 silent=1，MediaGo 收到即创建任务。关：MediaGo 会弹出下载表单让用户核对名字 / 类型 / 保存路径再提交。"
              : "仅 Schema 模式生效 —— HTTP 模式没有桌面弹窗概念，总是静默。"
          }
          checked={schemaSilent}
          disabled={disabled || !schemaOnly}
          onCheckedChange={(v) => apply({ schemaSilent: v })}
        />
      </CardContent>
    </Card>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: ToggleRowProps) {
  const id = `toggle-${label}`;
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border p-3">
      <div className="flex-1 space-y-1">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
