import client from './client'

export const getAidDispatches  = (params)       => client.get('/aid-dispatches', { params })
export const createAidDispatch = (data)         => client.post('/aid-dispatches', data)
export const acceptAidDispatch = (id, data)     => client.patch(`/aid-dispatches/${id}/accept`, data)
export const rejectAidDispatch = (id, data)     => client.patch(`/aid-dispatches/${id}/reject`, data)
