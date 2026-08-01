import { projectStore } from '../../lib/project-store';
import { NotFoundError } from '../../utils/errors';
import type { Lead, CreateLeadRequest } from '@vt/shared';

export class LeadService {
  async create(data: CreateLeadRequest): Promise<Lead> {
    const project = projectStore.getProject();
    if (project.id !== data.projectId) {
      throw new NotFoundError('Project');
    }

    const lead = projectStore.createLead({
      projectId: data.projectId,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      message: data.message ?? null,
      source: data.source ?? null,
    });

    return lead;
  }

  async list(opts: { search?: string; page: number; limit: number }) {
    const { search, page, limit } = opts;
    const result = projectStore.listLeads({ search, page, limit });

    return {
      data: result.data,
      total: result.total,
    };
  }
}

export const leadService = new LeadService();
