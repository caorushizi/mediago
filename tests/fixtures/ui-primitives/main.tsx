import { I18nextProvider, useTranslation } from "react-i18next";
import { Toaster, toast } from "../../../apps/ui/src/components/ui/toast";
import {
  Toaster as ExtensionToaster,
  toast as extensionToast,
} from "../../../packages/mediago-extension/src/components/ui/toast";
import { createExtensionI18n } from "../../../packages/mediago-extension/src/i18n";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import i18n from "../../../apps/ui/src/i18n";
import "../../../apps/ui/src/globals.css";
import { Button } from "../../../apps/ui/src/components/ui/button";
import { Checkbox } from "../../../apps/ui/src/components/ui/checkbox";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../../apps/ui/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../../../apps/ui/src/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "../../../apps/ui/src/components/ui/hover-card";
import { Input } from "../../../apps/ui/src/components/ui/input";
import {
  InfoTip,
  InfoTipTrigger,
  InfoTipContent,
} from "../../../apps/ui/src/components/ui/info-tip";
import { Progress } from "../../../apps/ui/src/components/ui/progress";
import {
  RadioGroup,
  RadioGroupItem,
} from "../../../apps/ui/src/components/ui/radio-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../apps/ui/src/components/ui/select";
import { Switch } from "../../../apps/ui/src/components/ui/switch";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../../apps/ui/src/components/ui/tooltip";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "../../../apps/player-ui/src/components/ui/sheet";
import { ScrollArea } from "../../../apps/player-ui/src/components/ui/scroll-area";
import { Button as ExtensionButton } from "../../../packages/mediago-extension/src/components/ui/button";
import { Label as ExtensionLabel } from "../../../packages/mediago-extension/src/components/ui/label";

const languages = [
  { value: "en", label: "English" },
  { value: "zh-CN", label: "简体中文" },
];

function RegressionPage() {
  const [language, setLanguage] = useState("zh-CN");
  const [selected, setSelected] = useState<boolean | "mixed">("mixed");
  const [updates, setUpdates] = useState(false);
  const [mode, setMode] = useState("normal");
  const [actions, setActions] = useState(0);

  return (
    <TooltipProvider delay={0}>
      <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        <h1>MediaGo UI interaction regression</h1>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger render={<Button />}>Open preferences</DialogTrigger>
            <DialogContent>
              <DialogTitle>Preferences</DialogTitle>
              <DialogDescription>
                Configure local download preferences.
              </DialogDescription>
              <Input aria-label="Name" />
              <Select
                items={languages}
                value={language}
                onValueChange={setLanguage}
              >
                <SelectTrigger aria-label="Language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog>
                <DialogTrigger render={<Button variant="outline" />}>
                  Advanced
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Advanced preferences</DialogTitle>
                  <DialogDescription>
                    Nested dialog focus regression.
                  </DialogDescription>
                  <Input aria-label="Advanced name" />
                  <DialogClose render={<Button />}>Return</DialogClose>
                </DialogContent>
              </Dialog>
              <DialogClose render={<Button />}>Done</DialogClose>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>
              Playlist
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>Playlist</SheetTitle>
              <SheetDescription>Scroll through local videos.</SheetDescription>
              <ScrollArea className="h-40" aria-label="Playlist tracks">
                {Array.from({ length: 30 }, (_, index) => (
                  <p key={index} className="p-2">
                    Video {index + 1}
                  </p>
                ))}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            aria-label="Select files"
            checked={selected === true}
            indeterminate={selected === "mixed"}
            onCheckedChange={setSelected}
          />
          <Checkbox aria-label="Unavailable file" disabled />
          <Switch
            aria-label="Automatic updates"
            checked={updates}
            onCheckedChange={setUpdates}
          />
        </div>
        <RadioGroup
          aria-label="Download mode"
          value={mode}
          onValueChange={setMode}
        >
          <label className="flex items-center gap-2">
            <RadioGroupItem value="normal" />
            Normal
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="fast" />
            Fast
          </label>
        </RadioGroup>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            Actions
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Download actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setActions((value) => value + 1)}
              >
                Refresh
              </DropdownMenuItem>
              <DropdownMenuItem disabled onClick={() => setActions(-100)}>
                Unavailable action
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>More actions</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => setActions((value) => value + 10)}
                  >
                    Export
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <output aria-label="Action count">{actions}</output>
        <Tooltip>
          <TooltipTrigger
            aria-label="Download shortcuts"
            render={<Button variant="outline" />}
          >
            Help
          </TooltipTrigger>
          <TooltipContent>Download shortcuts</TooltipContent>
        </Tooltip>
        <HoverCard>
          <HoverCardTrigger
            delay={0}
            closeDelay={0}
            render={<Button variant="outline" />}
          >
            Preview
          </HoverCardTrigger>
          <HoverCardContent>Local download preview</HoverCardContent>
        </HoverCard>
        <InfoTip>
          <InfoTipTrigger render={<Button variant="outline" />}>
            About statistics
          </InfoTipTrigger>
          <InfoTipContent aria-label="Statistics information">
            <p>Statistics are optional.</p>
            <Button
              variant="outline"
              onClick={() => setActions((value) => value + 1)}
            >
              Privacy policy
            </Button>
          </InfoTipContent>
        </InfoTip>
        <Progress aria-label="Download progress" value={25} />
        <Button nativeButton={false} render={<a href="#disabled" />} disabled>
          Disabled link
        </Button>
        <ExtensionLabel htmlFor="extension-name">Extension name</ExtensionLabel>
        <Input id="extension-name" />
        <ExtensionButton onClick={() => setActions((value) => value + 100)}>
          Extension action
        </ExtensionButton>
      </main>
    </TooltipProvider>
  );
}

function ToastRegressionPage({ extension }: { extension: boolean }) {
  const manager = extension ? extensionToast : toast;
  const { i18n: translations } = useTranslation();
  const [actions, setActions] = useState(0);
  useEffect(() => {
    manager.add({
      id: "startup",
      title: "Startup notification",
      type: "info",
      timeout: 0,
    });
  }, [manager]);
  return (
    <main
      style={{ paddingTop: 140, gap: 8 }}
      className="mx-auto flex max-w-xl flex-col p-6"
    >
      <h1>Toast interaction regression</h1>
      <Dialog>
        <DialogTrigger render={<Button />}>Open download</DialogTrigger>
        <DialogContent>
          <DialogTitle>Add download</DialogTitle>
          <DialogDescription>Enter a local download address.</DialogDescription>
          <Input aria-label="Download URL" />
          <Button
            onClick={() =>
              manager.add({
                title: "Download failed",
                type: "error",
                timeout: 0,
              })
            }
          >
            Report download error
          </Button>
        </DialogContent>
      </Dialog>
      {(["success", "error", "warning", "info"] as const).map((type) => (
        <Button
          key={type}
          onClick={() => manager.add({ title: type + " notification", type })}
        >
          Show {type}
        </Button>
      ))}
      <Button
        onClick={() => {
          for (let index = 1; index <= 5; index++) {
            manager.add({ title: "Queued notification " + index, timeout: 0 });
          }
        }}
      >
        Queue notices
      </Button>
      <Button
        onClick={() =>
          manager.add({
            title: "Download interrupted",
            type: "error",
            description: "The download can be retried.",
            timeout: 0,
            actionProps: {
              children: "Retry",
              onClick: () => setActions((value) => value + 1),
            },
          })
        }
      >
        Show action
      </Button>
      <Button
        onClick={() =>
          manager.add({
            title: "A_very_long_unbroken_download_filename_".repeat(5),
            description:
              "This persistent notification must fit the viewport without covering the close control.",
            timeout: 0,
          })
        }
      >
        Show long notice
      </Button>
      <Button
        onClick={() => {
          document.documentElement.classList.toggle("dark");
        }}
      >
        Toggle theme
      </Button>
      <Button onClick={() => void translations.changeLanguage("zh")}>
        Chinese labels
      </Button>
      <Button onClick={() => manager.close()}>Clear notices</Button>
      <output aria-label="Toast action count">{actions}</output>
    </main>
  );
}

await i18n.changeLanguage("en");
const container = document.getElementById("root");
if (!container) throw new Error("Missing regression fixture root");
const params = new URLSearchParams(location.search);
const extension = params.get("surface") === "extension";
const ToastHost = extension ? ExtensionToaster : Toaster;
createRoot(container).render(
  params.has("toast") ? (
    <StrictMode>
      <I18nextProvider i18n={extension ? createExtensionI18n("en") : i18n}>
        <ToastHost>
          <ToastRegressionPage extension={extension} />
        </ToastHost>
      </I18nextProvider>
    </StrictMode>
  ) : (
    <RegressionPage />
  ),
);
