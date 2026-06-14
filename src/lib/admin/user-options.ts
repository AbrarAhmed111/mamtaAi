export const ADMIN_BASE_ROLE_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'admin', label: 'Admin' },
] as const

export const ADMIN_ROLE_FILTER_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'parent', label: 'Parent' },
  { value: 'parent_expert', label: 'Parent + Expert' },
  { value: 'admin', label: 'Admin' },
] as const

/** @deprecated Use ADMIN_BASE_ROLE_OPTIONS — kept for imports that expect ADMIN_ROLE_OPTIONS */
export const ADMIN_ROLE_OPTIONS = ADMIN_BASE_ROLE_OPTIONS
