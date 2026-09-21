export function fetchPlatforms() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 'twitter', name: 'X (Twitter)', charLimit: 280 },
        { id: 'instagram', name: 'Instagram', charLimit: 2200 },
        { id: 'facebook', name: 'Facebook', charLimit: 63206 },
        { id: 'linkedin', name: 'LinkedIn', charLimit: 1300 }
      ])
    }, 300)
  })
}

export function savePost(post) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...post, id: post.id || Date.now().toString() })
    }, 400)
  })
}
