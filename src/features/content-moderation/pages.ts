import { lazy } from "react"

export const TopicsAdminPage = lazy(() => import("./pages/TopicsAdminPage").then((module) => ({ default: module.TopicsAdminPage })))

export const ContentNoticesPage = lazy(() => import("./pages/ContentNoticesPage").then((module) => ({ default: module.ContentNoticesPage })))
