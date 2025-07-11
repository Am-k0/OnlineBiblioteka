export const useApi = () => {
  const config = useRuntimeConfig()
  
  const get = (endpoint: string) => {
    return $fetch(`${config.public.apiBase}/${endpoint}`, {
      credentials: 'include'
    })
  }
  
  return { get }
}