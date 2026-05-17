import client from './client'

export const getAidBatches  = ()     => client.get('/aid-batches')
export const createAidBatch = (data) => client.post('/aid-batches', data)
export const deleteAidBatch = (id)   => client.delete(`/aid-batches/${id}`)
