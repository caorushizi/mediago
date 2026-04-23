import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ExtensionLanguage } from "@/shared/types";

import { useLanguageSetting } from "../use-language-setting";

export function LanguageCard() {
  const { t } = useTranslation();
  const { language, change } = useLanguageSetting();
  const loaded = language !== null;

  const options: Array<{ value: ExtensionLanguage; title: string }> = [
    { value: "system", title: t("options.language.system") },
    { value: "zh", title: t("options.language.zh") },
    { value: "en", title: t("options.language.en") },
    { value: "it", title: t("options.language.it") },
  ];

  const apply = async (next: ExtensionLanguage) => {
    const ok = await change(next);
    if (ok) toast.success(t("common.saved"));
    else toast.error(t("common.saveFailed"));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="inline-block h-1 w-1 rounded-full bg-timeline-grep" />
          locale
        </div>
        <CardTitle>{t("options.language.title")}</CardTitle>
        <CardDescription>{t("options.language.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup<ExtensionLanguage>
          value={language ?? "system"}
          onValueChange={(v) => void apply(v)}
          name="language"
        >
          {options.map((o) => (
            <RadioGroupItem
              key={o.value}
              value={o.value}
              title={o.title}
              disabled={!loaded}
            />
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
