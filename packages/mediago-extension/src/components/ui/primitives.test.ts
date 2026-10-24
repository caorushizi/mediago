import { DownloadType } from "@mediago/common";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { badgeVariants, variantForDownloadType } from "./badge";
import { buttonVariants } from "./button";
import { Card } from "./card";
import { Input } from "./input";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Switch } from "./switch";

describe("Button", () => {
  it("uses a compact brand primary with a compatible dark alias", () => {
    const primary = buttonVariants();
    const darkAlias = buttonVariants({ variant: "dark" });

    expect(primary).toContain("h-8");
    expect(primary).toContain("bg-action");
    expect(primary).toContain("text-primary-foreground");
    expect(darkAlias).toContain("bg-action");
    expect(darkAlias).toContain("text-primary-foreground");
  });

  it("exposes keyboard, pressed, and disabled feedback", () => {
    const classes = buttonVariants();

    expect(classes).toContain("focus-visible:ring-focus-ring");
    expect(classes).toContain("focus-visible:ring-offset-2");
    expect(classes).toMatch(/active:(translate|scale)/);
    expect(classes).toContain("disabled:cursor-not-allowed");
    expect(classes).toContain("whitespace-nowrap");
  });

  it("preserves pill compatibility and a visibly larger large size", () => {
    const tertiary = buttonVariants({ variant: "tertiary-pill" });
    const link = buttonVariants({ variant: "link" });

    expect(tertiary).toContain("rounded-full");
    expect(tertiary).toContain("bg-surface-selected");
    expect(tertiary).toContain("text-brand-foreground");
    expect(link).toContain("text-brand-foreground");
    expect(buttonVariants({ size: "pill" })).toContain("rounded-full");
    expect(buttonVariants({ size: "lg" })).toContain("h-9");
  });
});

describe("Card and Input", () => {
  it("renders cards as cool eight-pixel surfaces without hover lift", () => {
    const html = renderToStaticMarkup(
      createElement(Card, { interactive: true }, "Content"),
    );

    expect(html).toContain("rounded-lg");
    expect(html).toContain("bg-card");
    expect(html).toContain("hover:border-border-strong");
    expect(html).not.toMatch(/hover:(-translate|scale)/);
  });

  it("renders compact raised inputs without forcing monospace", () => {
    const html = renderToStaticMarkup(
      createElement(Input, { disabled: true, "aria-label": "Server URL" }),
    );

    expect(html).toContain("h-8");
    expect(html).toContain("bg-surface-raised");
    expect(html).toContain("border-control-border");
    expect(html).toContain("focus-visible:ring-focus-ring");
    expect(html).toContain("focus-visible:ring-offset-2");
    expect(html).toContain("disabled:cursor-not-allowed");
    expect(html).not.toContain("font-mono");
  });
});

describe("RadioGroup", () => {
  it("keeps native radio semantics and supports segment and compact variants", () => {
    const segment = renderToStaticMarkup(
      createElement(
        RadioGroup<string>,
        {
          name: "language",
          value: "en",
          onValueChange: () => undefined,
        },
        createElement(RadioGroupItem, {
          value: "en",
          title: "English",
          variant: "segment",
        }),
      ),
    );
    const compact = renderToStaticMarkup(
      createElement(
        RadioGroup<string>,
        { value: "zh", onValueChange: () => undefined },
        createElement(RadioGroupItem, {
          value: "zh",
          title: "Chinese",
          variant: "compact",
        }),
      ),
    );

    expect(segment).toContain('role="radiogroup"');
    expect(segment).toContain('type="radio"');
    expect(segment).toContain('name="language"');
    expect(segment).toContain("bg-surface-selected");
    expect(segment).toContain("focus-visible:outline-focus-ring");
    expect(compact).toContain("px-2.5");
  });

  it("shows a not-allowed cursor on both disabled label and input", () => {
    const html = renderToStaticMarkup(
      createElement(
        RadioGroup<string>,
        { value: "en", onValueChange: () => undefined },
        createElement(RadioGroupItem, {
          disabled: true,
          value: "en",
          title: "English",
        }),
      ),
    );

    expect(html.match(/cursor-not-allowed/g)).toHaveLength(2);
    expect(html).toContain("disabled");
  });
});

describe("Switch and Badge", () => {
  it("uses native switch state with brand, focus, and disabled styling", () => {
    const html = renderToStaticMarkup(
      createElement(Switch, {
        checked: true,
        disabled: true,
        onCheckedChange: () => undefined,
      }),
    );

    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("bg-primary");
    expect(html).toContain("focus-visible:ring-focus-ring");
    expect(html).toContain("focus-visible:ring-offset-2");
    expect(html).toContain("disabled:cursor-not-allowed");

    const unchecked = renderToStaticMarkup(
      createElement(Switch, {
        checked: false,
        onCheckedChange: () => undefined,
      }),
    );
    expect(unchecked).toContain("bg-control-track");
    expect(unchecked).not.toContain("bg-border");
  });

  it("unifies legacy download badges while preserving semantic statuses", () => {
    const legacy = ["thinking", "grep", "read", "edit", "mediago"] as const;

    for (const variant of legacy) {
      expect(badgeVariants({ variant })).toContain("bg-primary/10");
      expect(badgeVariants({ variant })).toContain("text-brand-foreground");
    }
    expect(badgeVariants()).toContain("bg-primary/10");
    expect(badgeVariants()).toContain("text-brand-foreground");
    expect(badgeVariants({ variant: "success" })).toContain(
      "bg-success-badge-background",
    );
    expect(badgeVariants({ variant: "success" })).toContain(
      "text-success-badge-foreground",
    );
    expect(badgeVariants({ variant: "warning" })).toContain(
      "bg-warning-badge-background",
    );
    expect(badgeVariants({ variant: "destructive" })).toContain(
      "bg-destructive-badge-background",
    );
    expect(badgeVariants({ variant: "destructive" })).not.toContain("/15");
    expect(variantForDownloadType("unknown")).toBe("secondary");
    expect(variantForDownloadType(DownloadType.xiaohongshu)).toBe("read");
  });
});
