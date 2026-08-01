export interface Setting {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  settings: Array<{ key: string; value: string }>;
}
