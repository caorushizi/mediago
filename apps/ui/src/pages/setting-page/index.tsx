import { useMemoizedFn } from "ahooks";
import type { UpdateErrorPhase } from "@mediago/common";
import { Copy, FolderOpen } from "lucide-react";
import { memo, startTransition, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CHECK_UPDATE } from "@/const";
import { usePlatform } from "@/hooks/use-platform";
import { useSessionStore } from "@/store/session";
import { isWeb, tdApp } from "@/utils";
import { SettingsFormProvider } from "./setting-fields";
import { SettingsPromoCard } from "./settings-promo-card";
import {
  BasicSettingsCard,
  BrowserExtensionCard,
  BrowserSettingsCard,
  CLISettingsCard,
  DockerSettingsCard,
  DownloadSettingsCard,
  MCPSettingsCard,
  MoreSettingsCard,
  OpenSourceCard,
  SkillsSettingsCard,
} from "./setting-sections";

const StableBasicSettingsCard = memo(BasicSettingsCard);
const StableBrowserSettingsCard = memo(BrowserSettingsCard);
const StableDownloadSettingsCard = memo(DownloadSettingsCard);
const StableDockerSettingsCard = memo(DockerSettingsCard);
const StableCLISettingsCard = memo(CLISettingsCard);
const StableMCPSettingsCard = memo(MCPSettingsCard);
const StableSkillsSettingsCard = memo(SkillsSettingsCard);
const StableBrowserExtensionCard = memo(BrowserExtensionCard);
const StableMoreSettingsCard = memo(MoreSettingsCard);
const StableOpenSourceCard = memo(OpenSourceCard);
const StableSettingsPromoCard = memo(SettingsPromoCard);
const SETTINGS_REVEAL_STEPS = isWeb ? 2 : 5;

const SettingsCards = memo(function SettingsCards({
  onCheckUpdate,
}: {
  onCheckUpdate: () => void;
}) {
  const [visibleStep, setVisibleStep] = useState(1);
  const allSettingsVisible = visibleStep >= (isWeb ? 2 : 5);

  useEffect(() => {
    let nextStep = 2;
    let frame = 0;
    const revealNext = () => {
      startTransition(() => setVisibleStep(nextStep));
      nextStep += 1;
      if (nextStep <= SETTINGS_REVEAL_STEPS) {
        frame = window.requestAnimationFrame(revealNext);
      }
    };

    frame = window.requestAnimationFrame(revealNext);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-start gap-4">
      <div className="flex min-w-0 flex-col gap-4">
        <StableBasicSettingsCard />
        {!isWeb && visibleStep >= 2 ? <StableBrowserSettingsCard /> : null}
        {visibleStep >= (isWeb ? 2 : 3) ? <StableDownloadSettingsCard /> : null}
        {!isWeb && allSettingsVisible ? <StableOpenSourceCard /> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        {!isWeb ? <StableDockerSettingsCard /> : <StableSkillsSettingsCard />}
        {!isWeb && visibleStep >= 2 ? <StableSkillsSettingsCard /> : null}
        {!isWeb && visibleStep >= 3 ? <StableCLISettingsCard /> : null}
        {visibleStep >= (isWeb ? 2 : 3) ? <StableMCPSettingsCard /> : null}
        {!isWeb && visibleStep >= 4 ? <StableBrowserExtensionCard /> : null}
        {allSettingsVisible ? (
          <>
            <StableMoreSettingsCard onCheckUpdate={onCheckUpdate} />
            {isWeb ? <StableOpenSourceCard /> : null}
            <StableSettingsPromoCard placement="settings" />
          </>
        ) : null}
      </div>
    </div>
  );
});

const SettingsContent = memo(function SettingsContent({
  onCheckUpdate,
}: {
  onCheckUpdate: () => void;
}) {
  return (
    <SettingsFormProvider>
      <div className="h-full min-h-0 overflow-x-hidden overflow-y-auto p-3">
        <SettingsCards onCheckUpdate={onCheckUpdate} />
      </div>
    </SettingsFormProvider>
  );
});

const SettingPage = () => {
  const { update } = usePlatform();
  const { t } = useTranslation();
  const updateState = useSessionStore((state) => state.updateState);
  const setUpdateState = useSessionStore((state) => state.setUpdateState);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);

  const showUnexpectedUpdateError = useMemoizedFn(
    (phase: UpdateErrorPhase, error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      const currentState = useSessionStore.getState().updateState;
      setUpdateState({
        ...currentState,
        status: "error",
        error: { code: "UPDATE_IPC_FAILED", message, phase },
      });
      setOpenUpdateModal(true);
    },
  );

  const handleCheckUpdate = useMemoizedFn(async () => {
    tdApp.onEvent(CHECK_UPDATE);
    const currentState = useSessionStore.getState().updateState;
    if (!currentState.portable) {
      setUpdateState({
        ...currentState,
        status: "checking",
        targetVersion: undefined,
        progress: 0,
        error: undefined,
      });
      setOpenUpdateModal(true);
    }

    try {
      const result = await update.check();
      setUpdateState(result.state);
      if (result.mode === "external" && result.state.status === "error") {
        setOpenUpdateModal(true);
      }
    } catch (error) {
      showUnexpectedUpdateError("check", error);
    }
  });

  const handleHiddenUpdateModal = useMemoizedFn(() => {
    setOpenUpdateModal(false);
  });

  const handleUpdate = useMemoizedFn(async () => {
    setUpdateState({
      ...useSessionStore.getState().updateState,
      status: "downloading",
      progress: 0,
      error: undefined,
    });
    try {
      const state = await update.startDownload();
      setUpdateState(state);
    } catch (error) {
      showUnexpectedUpdateError("download", error);
    }
  });

  const handleInstallUpdate = useMemoizedFn(async () => {
    try {
      const state = await update.install();
      setUpdateState(state);
    } catch (error) {
      showUnexpectedUpdateError("install", error);
    }
  });

  const handleOpenLogs = useMemoizedFn(async () => {
    try {
      const result = await update.openLogDirectory();
      if (!result.opened) {
        toast.add({ title: t("openUpdateLogsFailed"), type: "error" });
      }
    } catch {
      toast.add({ title: t("openUpdateLogsFailed"), type: "error" });
    }
  });

  const handleCopyDiagnosticInfo = useMemoizedFn(async () => {
    try {
      const diagnosticInfo = await update.getDiagnosticInfo();
      await navigator.clipboard.writeText(diagnosticInfo);
      toast.add({ title: t("updateDiagnosticsCopied"), type: "success" });
    } catch {
      toast.add({ title: t("updateDiagnosticsCopyFailed"), type: "error" });
    }
  });

  const statusMessage = (() => {
    switch (updateState.status) {
      case "checking":
        return t("checkingForUpdates");
      case "available":
        return t("updateAvailable");
      case "downloading":
        return t("downloadingUpdate");
      case "downloaded":
        return t("updateDownloaded");
      case "error":
        if (updateState.error?.phase === "download") {
          return t("updateDownloadFailed");
        }
        if (updateState.error?.phase === "install") {
          return t("updateInstallFailed");
        }
        return t("updateCheckFailed");
      case "idle":
      case "not-available":
        return t("updateNotAvailable");
    }
  })();

  const showProgress = ["downloading", "downloaded"].includes(
    updateState.status,
  );

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <SettingsContent onCheckUpdate={handleCheckUpdate} />

      <Dialog open={openUpdateModal} onOpenChange={setOpenUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("updateModal")}</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-28 flex-col justify-center gap-3">
            <DialogDescription>{statusMessage}</DialogDescription>
            {updateState.targetVersion &&
            ["available", "downloading", "downloaded"].includes(
              updateState.status,
            ) ? (
              <p className="text-sm text-muted-foreground">
                {t("updateVersionDescription", {
                  current: updateState.currentVersion,
                  target: updateState.targetVersion,
                })}
              </p>
            ) : null}
            {showProgress ? (
              <div className="flex items-center gap-3">
                <Progress
                  value={updateState.progress}
                  aria-label={t("updateAvailable")}
                  className="flex-1"
                />
                <span className="w-12 text-right text-sm tabular-nums">
                  {Math.round(updateState.progress)}%
                </span>
              </div>
            ) : null}
            {updateState.status === "error" ? (
              <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="break-words text-sm text-destructive">
                  {t("updateErrorDetailsHint")}
                </p>
                {updateState.error?.code ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    {updateState.error.code}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleOpenLogs}
                  >
                    <FolderOpen className="size-4" />
                    {t("openUpdateLogs")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyDiagnosticInfo}
                  >
                    <Copy className="size-4" />
                    {t("copyUpdateDiagnostics")}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleHiddenUpdateModal}
            >
              {t("close")}
            </Button>
            {updateState.status === "available" ? (
              <Button type="button" onClick={handleUpdate}>
                {t("downloadUpdate")}
              </Button>
            ) : null}
            {updateState.status === "downloaded" ? (
              <Button type="button" onClick={handleInstallUpdate}>
                {t("installAndRestart")}
              </Button>
            ) : null}
            {updateState.status === "error" ? (
              <Button type="button" onClick={handleCheckUpdate}>
                {t("retryUpdateCheck")}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingPage;
