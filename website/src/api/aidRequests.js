import client from './client'

export const getAidRequests   = (params)     => client.get('/aid-requests', { params })
export const createAidRequest = (data)       => client.post('/aid-requests', data)
export const reviewAidRequest = (id, data)   => client.patch(`/aid-requests/${id}`, data)
