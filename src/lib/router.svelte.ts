// Minimal hash router: #/, #/explore?q=..., #/saved, #/settings, #/post/:id
export type Route =
  | { name: 'home' }
  | { name: 'explore'; params: URLSearchParams }
  | { name: 'saved' }
  | { name: 'settings' }
  | { name: 'post'; id: string }

function parse(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  switch (parts[0]) {
    case 'explore': return { name: 'explore', params: new URLSearchParams(query) }
    case 'saved': return { name: 'saved' }
    case 'settings': return { name: 'settings' }
    case 'post': if (parts[1]) return { name: 'post', id: decodeURIComponent(parts[1]) }
  }
  return { name: 'home' }
}

export const router = $state({ route: parse(location.hash) })

addEventListener('hashchange', () => {
  router.route = parse(location.hash)
  scrollTo({ top: 0 })
})

export const href = {
  home: '#/',
  explore: (params?: Record<string, string>) => `#/explore${params ? `?${new URLSearchParams(params)}` : ''}`,
  saved: '#/saved',
  settings: '#/settings',
  post: (id: string) => `#/post/${encodeURIComponent(id)}`,
}

export const navigate = (to: string) => { location.hash = to.replace(/^#/, '') }
