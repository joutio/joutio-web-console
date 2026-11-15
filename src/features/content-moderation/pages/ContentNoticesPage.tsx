import { useState } from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDateTime } from "@/lib/format"
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/DataState"
import { PageHeader } from "@/shared/components/PageHeader"
import { useContentNotices, useDecideNotice } from "../hooks/useContentModeration"
import type { ContentNoticeDecision, ContentNoticeStatus, ContentNoticeView } from "../lib/content-moderation"

const STATUSES: { value: ContentNoticeStatus | "ALL"; label: string }[] = [
  { value: "RECEIVED", label: "À traiter" },
  { value: "ACTIONED", label: "Contenu retiré" },
  { value: "REJECTED", label: "Rejetées" },
  { value: "ALL", label: "Toutes" },
]
const CATEGORY: Record<ContentNoticeView["category"], string> = {
  COPYRIGHT: "Droit d'auteur",
  IMAGE_RIGHTS: "Droit à l'image",
  IMPERSONATION: "Usurpation / imitation",
  OTHER_ILLEGAL: "Autre contenu illicite",
}
const QUALITY: Record<ContentNoticeView["notifierQuality"], string> = {
  RIGHTS_HOLDER: "titulaire des droits",
  REPRESENTATIVE: "représentant",
  THIRD_PARTY: "tiers",
}
const DECISIONS: { value: ContentNoticeDecision; label: string }[] = [
  { value: "IMAGE_REMOVED", label: "Image retirée" },
  { value: "QUESTION_REMOVED", label: "Question supprimée" },
  { value: "TOPIC_CLOSED", label: "Sujet fermé" },
  { value: "REJECTED", label: "Rejeter" },
]

/**
 * Notifications de contenu illicite (LCEN/DSA, 2026-11-15) : file des notifications reçues et décision motivée.
 * L'action elle-même passe par les pages Sujets, Médias ou Questions ; la décision enregistre la suite donnée.
 */
export function ContentNoticesPage() {
  const [status, setStatus] = useState<ContentNoticeStatus | "ALL">("RECEIVED")
  const { data, isPending, error, refetch } = useContentNotices(status)

  return (
    <section className="space-y-4">
      <PageHeader
        title="Notifications de contenu"
        description="Signalements de contenus illicites (droit d'auteur, droit à l'image, imitation) et décision motivée."
      />
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((item) => (
          <Button key={item.value} size="sm" variant={status === item.value ? "default" : "outline"} onClick={() => setStatus(item.value)}>
            {item.label}
          </Button>
        ))}
      </div>
      {isPending ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.length === 0 ? (
        <EmptyState title="Aucune notification" />
      ) : (
        <div className="space-y-3">
          {data.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      )}
    </section>
  )
}

function NoticeCard({ notice }: { notice: ContentNoticeView }) {
  const decide = useDecideNotice()
  const [reason, setReason] = useState("")
  return (
    <article className="space-y-2 rounded-lg border border-border bg-background p-4 text-sm">
      <header className="flex flex-wrap items-center gap-2">
        <Badge variant={notice.status === "RECEIVED" ? "destructive" : "outline"}>{CATEGORY[notice.category]}</Badge>
        <span className="text-muted-foreground">{formatDateTime(notice.receivedAt)}</span>
        <span className="font-mono text-xs text-muted-foreground">{notice.id}</span>
      </header>
      <p>
        <strong>{notice.notifierName}</strong> ({QUALITY[notice.notifierQuality]}) —{" "}
        <a className="underline" href={`mailto:${notice.notifierEmail}`}>
          {notice.notifierEmail}
        </a>
      </p>
      <p>
        Contenu :{" "}
        <a className="break-all underline" href={notice.contentUrl} target="_blank" rel="noreferrer">
          {notice.contentUrl}
        </a>
      </p>
      <p className="whitespace-pre-line">{notice.description}</p>
      {notice.rightsEvidence && <p className="whitespace-pre-line text-muted-foreground">Justification : {notice.rightsEvidence}</p>}
      {notice.status === "RECEIVED" ? (
        <div className="space-y-2 border-t border-border pt-2">
          <p className="text-xs text-muted-foreground">
            Retire d'abord le contenu (pages <Link to="/topics" className="underline">Sujets</Link>,{" "}
            <Link to="/media" className="underline">Médias</Link> ou <Link to="/questions" className="underline">Questions</Link>), puis enregistre la
            décision.
          </p>
          <Textarea placeholder="Motif de la décision (communiqué au notifiant)" value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            {DECISIONS.map((decision) => (
              <Button
                key={decision.value}
                size="sm"
                variant={decision.value === "REJECTED" ? "outline" : "default"}
                disabled={!reason.trim() || decide.isPending}
                onClick={() => decide.mutate({ id: notice.id, decision: decision.value, reason })}
              >
                {decision.label}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <p className="border-t border-border pt-2 text-muted-foreground">
          {DECISIONS.find((decision) => decision.value === notice.decision)?.label ?? notice.decision} le {formatDateTime(notice.decidedAt)} :{" "}
          {notice.decisionReason}
        </p>
      )}
    </article>
  )
}
