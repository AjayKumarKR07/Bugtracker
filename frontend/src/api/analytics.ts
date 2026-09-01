import { apiClient } from './client';
import type {
  DeveloperAnalyticsResponse,
  IssueStatusDistributionResponse,
  IssueTrendResponse,
  ProjectAnalyticsListResponse,
  ProjectAnalyticsResponse,
  SeverityDistributionResponse,
  PriorityDistributionResponse,
  SystemAnalyticsResponse,
  AnalyticsReportDataResponse,
} from '../types/analytics';
import type { IssueStatus, Severity } from '../types/issue';

export interface AnalyticsFilterParams {
  project_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface TrendFilterParams extends AnalyticsFilterParams {
  interval?: 'day' | 'week' | 'month';
}

export interface ExportReportParams {
  project_id?: number;
  status?: IssueStatus;
  severity?: Severity;
  start_date?: string;
  end_date?: string;
}

export const analyticsApi = {
  getSystemOverview: async (params?: AnalyticsFilterParams): Promise<SystemAnalyticsResponse> => {
    const response = await apiClient.get<SystemAnalyticsResponse>(
      '/analytics/overview',
      { params }
    );
    return response.data;
  },

  getStatusDistribution: async (
    params?: AnalyticsFilterParams
  ): Promise<IssueStatusDistributionResponse> => {
    const response = await apiClient.get<IssueStatusDistributionResponse>(
      '/analytics/issues/status-distribution',
      { params }
    );
    return response.data;
  },

  getSeverityDistribution: async (
    params?: AnalyticsFilterParams
  ): Promise<SeverityDistributionResponse> => {
    const response = await apiClient.get<SeverityDistributionResponse>(
      '/analytics/issues/severity-distribution',
      { params }
    );
    return response.data;
  },

  getPriorityDistribution: async (
    params?: AnalyticsFilterParams
  ): Promise<PriorityDistributionResponse> => {
    const response = await apiClient.get<PriorityDistributionResponse>(
      '/analytics/issues/priority-distribution',
      { params }
    );
    return response.data;
  },

  getTrends: async (params?: TrendFilterParams): Promise<IssueTrendResponse> => {
    const response = await apiClient.get<IssueTrendResponse>(
      '/analytics/issues/trends',
      { params }
    );
    return response.data;
  },

  getAllProjectsAnalytics: async (): Promise<ProjectAnalyticsListResponse> => {
    const response = await apiClient.get<ProjectAnalyticsListResponse>(
      '/analytics/projects'
    );
    return response.data;
  },

  getProjectAnalytics: async (
    projectId: number,
    params?: AnalyticsFilterParams
  ): Promise<ProjectAnalyticsResponse> => {
    const response = await apiClient.get<ProjectAnalyticsResponse>(
      `/analytics/projects/${projectId}`,
      { params }
    );
    return response.data;
  },

  getDeveloperPerformance: async (params?: AnalyticsFilterParams): Promise<DeveloperAnalyticsResponse> => {
    const response = await apiClient.get<DeveloperAnalyticsResponse>(
      '/analytics/developers',
      { params }
    );
    return response.data;
  },

  exportIssuesCsv: async (params?: ExportReportParams): Promise<void> => {
    const response = await apiClient.get('/analytics/reports/issues/export', {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bugtracker_issues_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadReport: async (period: '1d' | '7d' | '30d'): Promise<AnalyticsReportDataResponse> => {
    const response = await apiClient.get<AnalyticsReportDataResponse>(
      '/analytics/report/download',
      { params: { period } }
    );
    return response.data;
  },
};
