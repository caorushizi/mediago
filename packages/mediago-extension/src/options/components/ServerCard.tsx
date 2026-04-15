import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DESKTOP_HTTP_BASE } from "@/shared/constants";
import type { InvocationMode } from "@/shared/types";

import { useOptions } from "../use-options";

const MODE_OPTIONS: Array<{
  value: InvocationMode;
  title: string;
  description: string;
}> = [
  {
    value: "desktop-schema",
    title: "Desktop · Schema 协议",
    description:
      "通过 mediago-community:// 协议唤起桌面版（未运行时自动拉起）。仅适用于本机安装了 MediaGo Desktop 的用户。",
  },
  {
    value: "desktop-http",
    title: "Desktop · HTTP 本地接口",
    description: `通过 ${DESKTOP_HTTP_BASE} 与运行中的桌面版通信。要求 Desktop 处于运行状态，但无需授权弹窗。`,
  },
  {
    value: "docker-http",
    title: "Docker / 自建服务 · HTTP",
    description:
      "连接远端 Docker 部署或任何自建 MediaGo 服务端。需要填写服务器地址；启用鉴权时额外填 API Key。",
  },
];

export function ServerCard() {
  const {
    mode,
    setMode,
    serverUrl,
    apiKey,
    setServerUrl,
    setApiKey,
    loaded,
    testing,
    saving,
    lastStatus,
    test,
    save,
  } = useOptions();

  const handleSave = async () => {
    const res = await save();
    if (res.ok) toast.success("已保存");
    else toast.error(res.error);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>调用方式</CardTitle>
        <CardDescription>
          扩展不会自动降级。选定模式后，调用失败会直接报错——如需切换请返回此页面手动更改。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <RadioGroup<InvocationMode>
          value={mode}
          onValueChange={setMode}
          name="mode"
        >
          {MODE_OPTIONS.map((o) => (
            <RadioGroupItem
              key={o.value}
              value={o.value}
              title={o.title}
              description={o.description}
              disabled={!loaded}
            />
          ))}
        </RadioGroup>

        {mode === "docker-http" && (
          <div className="space-y-4 rounded-md border bg-muted/30 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="server-url">服务器 URL</Label>
              <Input
                id="server-url"
                type="url"
                placeholder="http://your-host:8899"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                disabled={!loaded}
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="api-key">
                API Key <span className="text-muted-foreground">（可选）</span>
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder="留空则不发送 X-API-Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={!loaded}
                autoComplete="off"
              />
            </div>
          </div>
        )}

        {mode === "desktop-schema" && (
          <p className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
            通过 MediaGo 既有的{" "}
            <code>
              mediago-community://index.html/?n=1&amp;silent=1&amp;url=...
            </code>{" "}
            渲染路由协议调用桌面版。调用时会把当前 tab 跳到该协议 URL（参照
            cat-catch 的做法），Chrome 首次弹出"Open
            MediaGo-community?"对话框，点
            <strong>允许</strong>并勾<strong>总是允许</strong>之后即可静默直通。
            <br />
            <strong className="text-foreground">限制</strong>： Schema
            一次只能发送一条；批量请切 HTTP 模式。
          </p>
        )}

        {mode === "desktop-http" && (
          <p className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            固定连接 <code>{DESKTOP_HTTP_BASE}</code>
            ——桌面版随应用启动自动监听，点击"测试连接"可确认当前是否在线。
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void test()}
            disabled={testing || !loaded}
          >
            {testing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            测试连接
          </Button>
          <Button onClick={handleSave} disabled={saving || !loaded}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            保存
          </Button>
          {lastStatus && (
            <StatusInline ok={lastStatus.ok} text={lastStatus.message} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusInline({ ok, text }: { ok: boolean; text: string }) {
  if (ok) {
    return (
      <Badge variant="success" className="max-w-[360px] gap-1">
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        <span className="truncate">{text}</span>
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="max-w-[360px] gap-1">
      <XCircle className="h-3 w-3 shrink-0" />
      <span className="truncate">{text}</span>
    </Badge>
  );
}
