export interface DocTypeSchema {
  template_file: string
  required_fields: string[]
}

export interface DocumentSchema {
  modules: {
    [module: string]: {
      [docType: string]: DocTypeSchema
    }
  }
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}
