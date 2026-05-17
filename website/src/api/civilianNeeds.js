import client from './client'

export const getCivilianNeeds   = (params)   => client.get('/civilian-needs', { params })
export const createCivilianNeed = (data)     => client.post('/civilian-needs', data)
export const reviewCivilianNeed = (id, data) => client.patch(`/civilian-needs/${id}`, data)
