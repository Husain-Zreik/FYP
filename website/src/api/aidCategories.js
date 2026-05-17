import client from './client'

export const getAidCategories  = ()          => client.get('/aid-categories')
export const createAidCategory = (data)      => client.post('/aid-categories', data)
export const updateAidCategory = (id, data)  => client.patch(`/aid-categories/${id}`, data)
export const deleteAidCategory = (id)        => client.delete(`/aid-categories/${id}`)
