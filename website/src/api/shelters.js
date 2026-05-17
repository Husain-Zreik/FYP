import client from './client'

export const getShelters   = ()          => client.get('/shelters')
export const getShelter    = (id)        => client.get(`/shelters/${id}`)
export const createShelter = (data)      => client.post('/shelters', data)
export const updateShelter = (id, data)  => client.patch(`/shelters/${id}`, data)
export const deleteShelter = (id)        => client.delete(`/shelters/${id}`)
