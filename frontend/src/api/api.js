import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — attach token ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor — handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (username) => api.post('/auth/login', { username }),
  me:       ()         => api.get('/auth/me'),
  users:    ()         => api.get('/auth/users'),
}

// ── Documents ─────────────────────────────────────────────────────────────────
export const docsAPI = {
  list:        ()                => api.get('/documents'),
  get:         (id)              => api.get(`/documents/${id}`),
  create:      (title)           => api.post('/documents', { title }),
  rename:      (id, title)       => api.patch(`/documents/${id}/rename`, { title }),
  saveContent: (id, content)     => api.put(`/documents/${id}/content`, { content }),
  delete:      (id)              => api.delete(`/documents/${id}`),
}

// ── Sharing ───────────────────────────────────────────────────────────────────
export const sharesAPI = {
  share:   (id, username) => api.post(`/documents/${id}/share`, { username }),
  list:    (id)           => api.get(`/documents/${id}/shares`),
  revoke:  (id, username) => api.delete(`/documents/${id}/share/${username}`),
}

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadAPI = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default api