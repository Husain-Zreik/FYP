import client from './client'

export const getRequests       = ()              => client.get('/shelter-requests')
export const inviteCivilian    = (civilian_id)   => client.post('/shelter-requests/invite', { civilian_id })
export const acceptRequest     = (id)            => client.patch(`/shelter-requests/${id}/accept`)
export const rejectRequest     = (id)            => client.patch(`/shelter-requests/${id}/reject`)
export const searchAvailable   = (q = '')        => client.get(`/civilians/available?q=${encodeURIComponent(q)}`)
