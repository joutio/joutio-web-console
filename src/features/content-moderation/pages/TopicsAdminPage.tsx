import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/DataState"
import { PageHeader } from "@/shared/components/PageHeader"
import { useAdminTopics, useTopicActions } from "../hooks/useContentModeration"

/**
 * Sujets (2026-11-15) : badge « Officiel » (sujet éditorial de Joutio) et fermeture sur notification de contenu
 * illicite. Fermer repasse le sujet en brouillon et bloque sa publication ; le motif est affiché à l'équipe du sujet.
 */
export function TopicsAdminPage() {
  const { data, isPending, error, refetch } = useAdminTopics()
  const actions = useTopicActions()
  const [query, setQuery] = useState("")
  const [closing, setClosing] = useState<string>()
  const [reason, setReason] = useState("")

  const topics = (data ?? []).filter((topic) =>
    `${topic.names.fr ?? ""} ${topic.names.en ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <section className="space-y-4">
      <PageHeader title="Sujets" description="Badge Officiel, fermeture et réouverture des sujets (notifications de contenu)." />
      <Input placeholder="Chercher un sujet" value={query} onChange={(event) => setQuery(event.target.value)} className="max-w-sm" />
      {isPending ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : topics.length === 0 ? (
        <EmptyState title="Aucun sujet" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2 font-medium">Sujet</th>
                <th className="px-4 py-2 font-medium">État</th>
                <th className="px-4 py-2 font-medium">Questions</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.topicId} className="border-t border-border align-top">
                  <td className="px-4 py-2">
                    <div className="font-medium">{topic.names.fr ?? topic.names.en ?? topic.topicId}</div>
                    <div className="font-mono text-xs text-muted-foreground">{topic.topicId}</div>
                  </td>
                  <td className="space-x-1 px-4 py-2">
                    <Badge variant="outline">{topic.status === "PUBLISHED" ? "Publié" : topic.status === "DRAFT" ? "Brouillon" : "Archivé"}</Badge>
                    {topic.official && <Badge>Officiel</Badge>}
                    {topic.closed && <Badge variant="destructive">Fermé</Badge>}
                  </td>
                  <td className="px-4 py-2 tabular-nums">{topic.questionsCount}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actions.official.isPending}
                        onClick={() => actions.official.mutate({ topicId: topic.topicId, official: !topic.official })}
                      >
                        {topic.official ? "Retirer Officiel" : "Marquer Officiel"}
                      </Button>
                      {topic.closed ? (
                        <Button size="sm" variant="outline" disabled={actions.reopen.isPending} onClick={() => actions.reopen.mutate(topic.topicId)}>
                          Rouvrir
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setClosing(topic.topicId)
                            setReason("")
                          }}
                        >
                          Fermer
                        </Button>
                      )}
                    </div>
                    {closing === topic.topicId && (
                      <form
                        className="mt-2 flex flex-wrap gap-2"
                        onSubmit={(event) => {
                          event.preventDefault()
                          actions.close.mutate({ topicId: topic.topicId, reason }, { onSuccess: () => setClosing(undefined) })
                        }}
                      >
                        <Input
                          autoFocus
                          placeholder="Motif communiqué à l'auteur"
                          value={reason}
                          maxLength={500}
                          onChange={(event) => setReason(event.target.value)}
                          className="min-w-64 flex-1"
                        />
                        <Button size="sm" type="submit" variant="destructive" disabled={!reason.trim() || actions.close.isPending}>
                          Confirmer
                        </Button>
                        <Button size="sm" type="button" variant="ghost" onClick={() => setClosing(undefined)}>
                          Annuler
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
