import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { deletePost } from '../features/posts/postsSlice'

export default function PostList() {
  const postsState = useSelector((s) => s.posts)
  const platforms = useSelector((s) => s.platforms.entities)
  const dispatch = useDispatch()

  return (
    <div className="post-list">
      <h2>Posts</h2>
      {postsState.ids.length === 0 && <div className="empty">No posts yet.</div>}
      {postsState.ids.map((id) => {
        const p = postsState.entities[id]
        return (
          <article key={id} className="post">
            <div className="meta">
              <span className="date">{new Date(p.createdAt).toLocaleString()}</span>
              <span className="platforms">{p.platforms.map((pid) => platforms[pid]?.name || pid).join(', ')}</span>
            </div>
            <p className="content">{p.content}</p>
            <div className="post-actions">
              <button onClick={() => dispatch(deletePost(id))}>Delete</button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
