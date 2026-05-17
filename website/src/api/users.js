import client from './client'

export const getUsers        = ()          => client.get('/users')
export const getUser         = (id)        => client.get(`/users/${id}`)
export const createUser      = (data)      => client.post('/users', data)
export const updateUser      = (id, data)  => client.patch(`/users/${id}`, data)
export const deleteUser      = (id)        => client.delete(`/users/${id}`)

export const uploadIdDocument = (id, file) => {
  const form = new FormData()
  form.append('document', file)
  return client.post(`/users/${id}/upload-id`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
