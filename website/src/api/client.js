import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Unwrap response.data and normalize errors
client.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data ?? error)
)

export default client
