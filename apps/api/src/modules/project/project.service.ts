import { projectStore } from '../../lib/project-store';
import { generateSlug } from '../../utils/slug';
import type { Project, UpdateProjectRequest } from '@vt/shared';

export class ProjectService {
  async get(): Promise<Project> {
    const p = projectStore.getProject();
    return this.toDto(p);
  }

  async update(data: UpdateProjectRequest & { name?: string; companyName?: string; description?: string }): Promise<Project> {
    const updates: any = {};
    if (data.name !== undefined) {
      updates.name = data.name;
      updates.slug = generateSlug(data.name);
    }
    if (data.companyName !== undefined) updates.companyName = data.companyName;
    if (data.description !== undefined) updates.description = data.description;
    if ((data as any).guidedTourEnabled !== undefined) updates.guidedTourEnabled = (data as any).guidedTourEnabled;

    const p = projectStore.updateProject(updates);
    return this.toDto(p);
  }

  private toDto(p: { id: string; name: string; slug: string; companyName: string | null; description: string | null; guidedTourEnabled: boolean; createdAt: string; updatedAt: string }): Project {
    return {
      id: p.id, name: p.name, slug: p.slug, companyName: p.companyName,
      description: p.description, isPublished: true, // Always "published" in builder mode
      publishedAt: null,
      guidedTourEnabled: p.guidedTourEnabled,
      createdAt: p.createdAt, updatedAt: p.updatedAt,
    };
  }
}

export const projectService = new ProjectService();
