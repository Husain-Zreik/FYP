import client from './client'

export const getAidSchedules   = (params)       => client.get('/aid-schedules', { params })
export const createAidSchedule = (data)         => client.post('/aid-schedules', data)
export const updateAidSchedule = (id, data)     => client.patch(`/aid-schedules/${id}`, data)
export const deleteAidSchedule = (id)           => client.delete(`/aid-schedules/${id}`)
export const dispatchSchedule  = (id)           => client.post(`/aid-schedules/${id}/dispatch`)
