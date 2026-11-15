import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { queryKeys } from "@/lib/query-keys"
import { contentModerationService, type ContentNoticeDecision, type ContentNoticeStatus } from "../lib/content-moderation"

export function useAdminTopics() {
  return useQuery({ queryKey: queryKeys.contentModeration.topics(), queryFn: contentModerationService.topics })
}

export function useContentNotices(status: ContentNoticeStatus | "ALL") {
  return useQuery({ queryKey: queryKeys.contentModeration.notices(status), queryFn: () => contentModerationService.notices(status) })
}

export function useContentNoticeSummary() {
  return useQuery({ queryKey: queryKeys.contentModeration.summary(), queryFn: contentModerationService.summary, refetchInterval: 60_000 })
}

/** Actions sur un sujet ; la liste des sujets (et le filtre de la page Questions) se relit ensuite. */
export function useTopicActions() {
  const client = useQueryClient()
  const refresh = () => {
    void client.invalidateQueries({ queryKey: queryKeys.contentModeration.topics() })
    void client.invalidateQueries({ queryKey: queryKeys.questions.topics() })
  }
  return {
    official: useMutation({
      mutationFn: ({ topicId, official }: { topicId: string; official: boolean }) => contentModerationService.setOfficial(topicId, official),
      onSuccess: (_, { official }) => {
        toast.success(official ? "Badge Officiel posé" : "Badge Officiel retiré")
        refresh()
      },
    }),
    close: useMutation({
      mutationFn: ({ topicId, reason }: { topicId: string; reason: string }) => contentModerationService.close(topicId, reason),
      onSuccess: () => {
        toast.success("Sujet fermé")
        refresh()
      },
    }),
    reopen: useMutation({
      mutationFn: (topicId: string) => contentModerationService.reopen(topicId),
      onSuccess: () => {
        toast.success("Sujet rouvert")
        refresh()
      },
    }),
  }
}

export function useDecideNotice() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decision, reason }: { id: string; decision: ContentNoticeDecision; reason: string }) =>
      contentModerationService.decide(id, decision, reason),
    onSuccess: () => {
      toast.success("Décision enregistrée")
      void client.invalidateQueries({ queryKey: ["bff", "content-moderation"] })
    },
  })
}
