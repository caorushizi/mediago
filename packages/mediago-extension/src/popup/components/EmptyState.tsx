import { Inbox } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center text-muted-foreground">
      <Inbox className="h-8 w-8 opacity-40" />
      <p className="text-xs leading-relaxed">
        当前页面暂未检测到可下载资源。
        <br />
        浏览网页过程中命中规则时会自动出现在这里。
      </p>
    </div>
  );
}
