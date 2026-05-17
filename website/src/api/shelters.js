import client from './client'

export const getShelters   = ()          => client.get('/shelters')
export const getShelter    = (id)        => client.get(`/shelters/${id}`)
export const createShelter = (data)      => client.post('/shelters', data)
export const updateShelter = (id, data)  => client.patch(`/shelters/${id}`, data)
export const deleteShelter = (id)        => client.delete(`/shelters/${id}`)

export const uploadShelterImage = (id, file) => {
  const form = new FormData()
  form.append('image', file)
  return client.post(`/shelters/${id}/upload-image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
