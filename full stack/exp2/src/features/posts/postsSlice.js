import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { savePost as apiSavePost } from '../../api/mockApi'

export const submitPost = createAsyncThunk('posts/submit', async (post) => {
  const saved = await apiSavePost(post)
  return saved
})

const postsSlice = createSlice({
  name: 'posts',
  initialState: { entities: {}, ids: [], status: 'idle', error: null },
  reducers: {
    addPost: {
      reducer(state, action) {
        const p = action.payload
        state.entities[p.id] = p
        if (!state.ids.includes(p.id)) state.ids.unshift(p.id)
      },
      prepare(payload) {
        return { payload: { id: Date.now().toString(), ...payload } }
      }
    },
    deletePost(state, action) {
      const id = action.payload
      if (state.entities[id]) {
        delete state.entities[id]
        state.ids = state.ids.filter((i) => i !== id)
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitPost.pending, (state) => {
        state.status = 'saving'
      })
      .addCase(submitPost.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const p = action.payload
        state.entities[p.id] = p
        if (!state.ids.includes(p.id)) state.ids.unshift(p.id)
      })
      .addCase(submitPost.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  }
})

export const { addPost, deletePost } = postsSlice.actions

export default postsSlice.reducer
