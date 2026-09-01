export interface SystemAnalyticsResponse {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_projects: number;
  active_projects: number;
  total_issues: number;
  open_issues: number;
  in_progress_issues: number;
  resolved_issues: number;
  closed_issues: number;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
}

export interface IssueStatusDistributionResponse {
  REPORTED: number;
  TRIAGED: number;
  ASSIGNED: number;
  IN_DEVELOPMENT: number;
  IN_REVIEW: number;
  IN_TESTING: number;
  RESOLVED: number;
  CLOSED: number;
  REOPENED: number;
}

export interface SeverityDistributionResponse {
  MINOR: number;
  MAJOR: number;
  CRITICAL: number;
  BLOCKER: number;
}

export interface PriorityDistributionResponse {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  URGENT: number;
}

export interface IssueTrendItem {
  date: string;
  created_count: number;
  resolved_count: number;
}

export interface IssueTrendResponse {
  interval: string;
  items: IssueTrendItem[];
  total_created: number;
  total_resolved: number;
}

export interface ProjectAnalyticsResponse {
  project_id: number;
  project_name: string;
  project_key: string;
  total_issues: number;
  open_issues: number;
  in_progress_issues: number;
  resolved_issues: number;
  closed_issues: number;
  critical_issues: number;
  resolution_rate: number;
}

export interface ProjectAnalyticsListResponse {
  items: ProjectAnalyticsResponse[];
  total: number;
}

export interface DeveloperAnalyticsItem {
  developer_id: number;
  developer_name: string;
  developer_email: string;
  assigned_issues: number;
  resolved_issues: number;
  open_issues: number;
  resolution_rate: number;
  average_resolution_time_hours: number | null;
}

export interface DeveloperAnalyticsResponse {
  items: DeveloperAnalyticsItem[];
  total: number;
}

export interface AnalyticsReportDataResponse {
  system_overview: SystemAnalyticsResponse;
  status_distribution: IssueStatusDistributionResponse;
  severity_distribution: SeverityDistributionResponse;
  priority_distribution: PriorityDistributionResponse;
  trends: IssueTrendResponse;
  project_analytics: ProjectAnalyticsResponse[];
  developer_performance: DeveloperAnalyticsItem[];
  generated_at: string;
}
