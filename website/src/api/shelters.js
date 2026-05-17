import client from './client'

export const getShelters = () => client.get('/shelters')
