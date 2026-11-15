import { questionsService, type AdminTopicOptionView } from "@/features/questions"
import { bffApi } from "@/lib/bff-api"
import { ENDPOINTS } from "@/lib/endpoints"

export type ContentNoticeStatus = "RECEIVED" | "ACTIONED" | "REJECTED"
export type ContentNoticeDecision = "IMAGE_REMOVED" | "QUESTION_REMOVED" | "TOPIC_CLOSED" | "REJECTED"

/** Notification de contenu illicite (`ContentNotice` du BFF). */
export interface ContentNoticeView {
  id: string
  status: ContentNoticeStatus
  notifierName: string
  notifierEmail: string
  notifierQuality: "RIGHTS_HOLDER" | "REPRESENTATIVE" | "THIRD_PARTY"
  contentUrl: string
  category: "COPYRIGHT" | "IMAGE_RIGHTS" | "IMPERSONATION" | "OTHER_ILLEGAL"
  description: string
  rightsEvidence: string | null
  reporterUserId: string | null
  receivedAt: string
  decidedAt: string | null
  decidedBy: string | null
  decision: ContentNoticeDecision | null
  decisionReason: string | null
}

export const contentModerationService = {
  topics: (): Promise<AdminTopicOptionView[]> => questionsService.topics(),
  setOfficial: (topicId: string, official: boolean) =>
    bffApi.put<void>(ENDPOINTS.bff.topics.official(topicId), { official }),
  close: (topicId: string, reason: string) => bffApi.post<void>(ENDPOINTS.bff.topics.close(topicId), { reason }),
  reopen: (topicId: string) => bffApi.post<void>(ENDPOINTS.bff.topics.reopen(topicId)),
  notices: (status: ContentNoticeStatus | "ALL"): Promise<ContentNoticeView[]> =>
    bffApi.get<ContentNoticeView[]>(
      status === "ALL" ? ENDPOINTS.bff.contentNotices.list : `${ENDPOINTS.bff.contentNotices.list}?status=${status}&size=100`,
    ),
  summary: (): Promise<{ received: number }> => bffApi.get<{ received: number }>(ENDPOINTS.bff.contentNotices.summary),
  decide: (noticeId: string, decision: ContentNoticeDecision, reason: string) =>
    bffApi.post<ContentNoticeView>(ENDPOINTS.bff.contentNotices.decide(noticeId), { decision, reason }),
}
