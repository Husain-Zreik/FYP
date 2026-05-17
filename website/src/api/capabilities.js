import client from './client'

export const getCapabilities    = ()           => client.get('/role-capabilities')
export const updateCapabilities = (role, caps) => client.patch('/role-capabilities', { role, capabilities: caps })
