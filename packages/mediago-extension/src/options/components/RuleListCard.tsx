import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Rule {
  label: string;
  detail: string;
  type: "m3u8" | "direct" | "bilibili" | "youtube";
}

const RULES: Rule[] = [
  { label: "HLS / m3u8 流", detail: "*.m3u8", type: "m3u8" },
  {
    label: "直连媒体文件",
    detail: "*.mp4 / .flv / .mov / .avi / .mkv / .wmv / .m4a / .ogg",
    type: "direct",
  },
  {
    label: "Bilibili 视频页",
    detail: "bilibili.com/video/*",
    type: "bilibili",
  },
  {
    label: "YouTube",
    detail: "youtube.com, youtu.be",
    type: "youtube",
  },
];

export function RuleListCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>嗅探规则</CardTitle>
        <CardDescription>
          当前规则由 <code>@mediago/shared-common</code>{" "}
          集中维护，桌面版和浏览器扩展共享同一份。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {RULES.map((rule) => (
            <li
              key={rule.type}
              className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2"
            >
              <div>
                <div className="text-sm font-medium">{rule.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  <code>{rule.detail}</code>
                </div>
              </div>
              <Badge variant="secondary" className="uppercase">
                {rule.type}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
