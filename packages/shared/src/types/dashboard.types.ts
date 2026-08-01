export interface DashboardStats {
  totalProjects: number;
  publishedProjects: number;
  draftProjects: number;
  totalScenes: number;
  totalHotspots: number;
  totalLeads: number;
  leadsThisMonth: number;
  totalAssets: number;
  storageUsed: number;
  storageUsedFormatted: string;
}

export interface RecentActivity {
  type: 'project_created' | 'project_published' | 'project_unpublished' | 'scene_uploaded' | 'lead_received';
  message: string;
  timestamp: string;
  projectId?: string;
  projectName?: string;
  leadId?: string;
}
