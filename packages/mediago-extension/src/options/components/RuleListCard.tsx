import { useTranslation } from "react-i18next";

import { Badge, variantForDownloadType } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RuleType = "m3u8" | "bilibili" | "direct" | "youtube";

interface Rule {
  type: RuleType;
  labelKey: string;
  detail: string;
}

const RULES: Rule[] = [
  { type: "m3u8", labelKey: "options.rules.m3u8Label", detail: "*.m3u8" },
  {
    type: "direct",
    labelKey: "options.rules.directLabel",
    detail: "*.mp4 / .flv / .mov / .avi / .mkv / .wmv / .m4a / .ogg",
  },
  {
    type: "bilibili",
    labelKey: "options.rules.bilibiliLabel",
    detail: "bilibili.com/video/*",
  },
  {
    type: "youtube",
    labelKey: "options.rules.youtubeLabel",
    detail: "youtube.com, youtu.be",
  },
];

export function RuleListCard() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="inline-block h-1 w-1 rounded-full bg-timeline-thinking" />
          rules
        </div>
        <CardTitle>{t("options.rules.title")}</CardTitle>
        <CardDescription>
          {t("options.rules.descriptionLead")}{" "}
          <code className="rounded-xs bg-surface-300 px-1 py-0.5 font-mono text-[11px] text-foreground">
            @mediago/shared-common
          </code>{" "}
          {t("options.rules.descriptionTail")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Vertical list styled like a timeline: a faint warm rule
            runs down the left edge, and each row has a color dot
            matching the DownloadType's timeline color. This riffs on
            Cursor's AI timeline visualisation — thinking / grep /
            read / edit as connected beats — but applied to our
            sniff-rule taxonomy. */}
        <ul className="relative space-y-3 pl-5 before:absolute before:inset-y-1 before:left-[5px] before:w-px before:bg-border">
          {RULES.map((rule) => (
            <li key={rule.type} className="relative flex items-start gap-3">
              <span
                className={`absolute -left-[calc(1.25rem-1px)] top-1.5 h-2 w-2 rounded-full ring-4 ring-card ${DOT_CLASS[rule.type]}`}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium leading-tight">
                  {t(rule.labelKey)}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {rule.detail}
                </div>
              </div>
              <Badge variant={variantForDownloadType(rule.type)}>
                {rule.type}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * Fully-literal Tailwind class strings so the JIT scanner can pick
 * them up. We *can't* build these with a template literal
 * (`bg-timeline-${…}`) — Tailwind scans text, not JS, so a dynamic
 * fragment would be dropped from the generated CSS.
 */
const DOT_CLASS: Record<RuleType, string> = {
  bilibili: "bg-timeline-thinking",
  direct: "bg-timeline-grep",
  youtube: "bg-timeline-read",
  m3u8: "bg-timeline-edit",
};
