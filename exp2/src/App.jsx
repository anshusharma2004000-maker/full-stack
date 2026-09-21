import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PostComposer from './components/PostComposer'
import PostList from './components/PostList'
import { fetchPlatforms } from './features/platforms/platformsSlice'

export default function App() {
  const dispatch = useDispatch()
  const platformsStatus = useSelector((s) => s.platforms.status)

  useEffect(() => {
    if (platformsStatus === 'idle') dispatch(fetchPlatforms())
  }, [platformsStatus, dispatch])

  return (
    <div className="app">
      <h1>Post Composer — Multi-platform</h1>
      <PostComposer />
      <PostList />
    </div>
  )
}
