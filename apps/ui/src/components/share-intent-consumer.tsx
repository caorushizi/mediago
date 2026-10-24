import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/toast";
import { IpcEvent } from "@mediago/common";
import { usePlatform } from "@/hooks/use-platform";
import {
  consumeStartupShareError,
  drainPendingWebShareIntents,
} from "@/services/share-intent";
import { useDownloadDialogStore } from "@/store/download-dialog";
import { useShareIntentQueueStore } from "@/store/share-intent";

export function ShareIntentConsumer() {
  const { t } = useTranslation();
  const platform = usePlatform();
  const enqueue = useShareIntentQueueStore((state) => state.enqueue);
  const remove = useShareIntentQueueStore((state) => state.remove);
  const nextIntent = useShareIntentQueueStore(
    (state) => state.pending[0] ?? null,
  );
  const dialogOpen = useDownloadDialogStore((state) => state.open);
  const openNew = useDownloadDialogStore((state) => state.openNew);

  useEffect(() => {
    const drainElectronIntents = async () => {
      try {
        const intents = await platform.app.drainShareIntents();
        if (intents.length > 0) enqueue(intents);
      } catch {
        // Electron may be closing while an IPC drain is in flight.
      }
    };
    const handleAvailable = () => {
      void drainElectronIntents();
    };

    platform.on(IpcEvent.app.shareIntentAvailable, handleAvailable);
    enqueue(drainPendingWebShareIntents());
    if (consumeStartupShareError())
      toast.add({ title: t("shareIntentInvalid"), type: "error" });
    void drainElectronIntents();

    return () => {
      platform.off(IpcEvent.app.shareIntentAvailable, handleAvailable);
    };
  }, [enqueue, platform, t]);

  useEffect(() => {
    if (dialogOpen || !nextIntent) return;

    remove(nextIntent.id);
    if (nextIntent.warning === "legacy-auto-action-disabled") {
      toast.add({
        title: t("shareIntentLegacyAutomaticActionDisabled"),
        type: "warning",
      });
    }
    openNew({
      batch: false,
      name: nextIntent.name,
      type: nextIntent.type,
      url: nextIntent.url,
    });
  }, [dialogOpen, nextIntent, openNew, remove, t]);

  return null;
}
