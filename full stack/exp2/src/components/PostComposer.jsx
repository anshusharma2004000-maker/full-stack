import React, { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { submitPost, addPost } from '../features/posts/postsSlice'

export default function PostComposer() {
  const dispatch = useDispatch()
  const platforms = useSelector((s) => s.platforms)
  const [content, setContent] = useState('')
  const [selected, setSelected] = useState([])

  const platformList = useMemo(() => platforms.ids.map((id) => platforms.entities[id] || {}), [platforms])

  function togglePlatform(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const validation = useMemo(() => {
    const errors = {}
    selected.forEach((pid) => {
      const p = platforms.entities[pid]
      if (!p) return
      if (content.length > p.charLimit) {
        errors[pid] = `Exceeds ${p.charLimit} chars` 
      }
    })
    return errors
  }, [selected, content, platforms.entities])

  const canSubmit = selected.length > 0 && Object.keys(validation).length === 0 && content.trim().length > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    const payload = {
      content: content.trim(),
      platforms: selected.slice(),
      createdAt: new Date().toISOString()
    }
    // optimistic add for instant UI feedback — use action creator to get generated id
    const addedAction = dispatch(addPost(payload))
    const generatedId = addedAction.payload.id
    // persist in background with same id
    dispatch(submitPost({ ...payload, id: generatedId }))
    setContent('')
    setSelected([])
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        placeholder="Write your post..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="platforms">
        {platformList.map((p) => (
          <label key={p.id} className="platform">
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={() => togglePlatform(p.id)}
            />
            <span>{p.name}</span>
            <small>Limit: {p.charLimit}</small>
            {selected.includes(p.id) && (
              <div className="counter">
                {content.length} / {p.charLimit} {content.length > p.charLimit ? '⚠️' : ''}
              </div>
            )}
            {validation[p.id] && <div className="error">{validation[p.id]}</div>}
          </label>
        ))}
      </div>

      <div className="actions">
        <button type="submit" disabled={!canSubmit}>
          Post
        </button>
      </div>
    </form>
  )
}
