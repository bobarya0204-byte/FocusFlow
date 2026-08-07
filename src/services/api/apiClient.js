import { appEnv } from '../../config/env.js'
import { getAccessToken } from './tokenProvider.js'

function getApiBaseUrl() {
  const base = appEnv.apiBaseUrl || 'http://localhost:3001/api'
  return base.replace(/\/$/, '')
}

/**
 * @param {string} path
 * @param {RequestInit} [options]
 */
export async function apiRequest(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${getApiBaseUrl()}${normalizedPath}`

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const accessToken = await getAccessToken()
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = response.statusText || 'Request failed'
    try {
      const body = await response.json()
      message = body?.error?.message || message
    } catch {
      // ignore non-JSON error bodies
    }
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const tasksApi = {
  getAll() {
    return apiRequest('/tasks')
  },

  getById(id) {
    return apiRequest(`/tasks/${encodeURIComponent(id)}`)
  },

  create(task) {
    return apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    })
  },

  update(id, updates) {
    return apiRequest(`/tasks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  delete(id) {
    return apiRequest(`/tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}

export const projectsApi = {
  getAll() {
    return apiRequest('/projects')
  },

  getById(id) {
    return apiRequest(`/projects/${encodeURIComponent(id)}`)
  },

  create(project) {
    return apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    })
  },

  update(id, updates) {
    return apiRequest(`/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  delete(id) {
    return apiRequest(`/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}

export const focusSessionsApi = {
  getAll() {
    return apiRequest('/focus-sessions')
  },

  create(session) {
    return apiRequest('/focus-sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    })
  },

  update(id, updates) {
    return apiRequest(`/focus-sessions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  delete(id) {
    return apiRequest(`/focus-sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}
