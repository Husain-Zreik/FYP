import client from './client'

export const getGovernmentStats = () => client.get('/stats/government')
export const getShelterStats    = () => client.get('/stats/shelter')
