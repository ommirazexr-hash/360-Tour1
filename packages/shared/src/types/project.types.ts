export interface Project {
  id: string;
  name: string;
  slug: string;
  companyName: string | null;
  description: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  guidedTourEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListItem extends Project {
  sceneCount: number;
  hotspotCount: number;
  coverImageUrl: string | null;
}

export interface CreateProjectRequest {
  name: string;
  companyName?: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  companyName?: string;
  description?: string;
}

export interface DuplicateProjectRequest {
  name?: string;
}
