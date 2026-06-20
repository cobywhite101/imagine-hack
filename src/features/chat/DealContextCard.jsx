import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Paperclip, FileText, Video } from "lucide-react";

/** The meeting/deal context card shown inside an assistant message. */
export function DealContextCard({ deal }) {
  return (
    <Card className="my-3 flex-row items-center gap-3 overflow-hidden rounded-xl p-3 pl-0">
      {/* Green accent rail */}
      <span className="h-12 w-1 shrink-0 self-stretch rounded-full bg-success" />

      {/* Thumbnail with platform glyph */}
      <div className="relative shrink-0">
        <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-sm font-medium text-foreground">
          GL
        </span>
        <span className="absolute -bottom-1 -right-1 flex size-4.5 items-center justify-center rounded bg-card ring-2 ring-card">
          <Video className="size-3 text-primary" />
        </span>
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{deal.title}</span>
        </div>
        <div className="text-xs text-muted-foreground">{deal.when}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" /> {deal.comments}
          </span>
          <span className="inline-flex items-center gap-1">
            <Paperclip className="size-3" /> {deal.attachments}
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3" /> {deal.docs}
          </span>
          <span className="inline-flex items-center gap-1 text-primary">
            <Video className="size-3" /> Recorded {deal.recorded}
          </span>
        </div>
      </div>

      {/* Attendees */}
      <div className="flex shrink-0 -space-x-2 self-start pr-1">
        {deal.attendees.map((a) => (
          <Avatar key={a} className="size-6 ring-2 ring-card">
            <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
              {a[0]}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    </Card>
  );
}
