import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchPlatforms as apiFetchPlatforms } from '../../api/mockApi'

export const fetchPlatforms = createAsyncThunk('platforms/fetch', async () => {
  const res = await apiFetchPlatforms()
  return res
})

const platformsSlice = createSlice({
  name: 'platforms',
  initialState: { entities: {}, ids: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlatforms.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchPlatforms.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // reset entities and ids to avoid duplicates when refetching
        state.entities = {}
        state.ids = []
        action.payload.forEach((p) => {
          state.entities[p.id] = p
          state.ids.push(p.id)
        })
      })
      .addCase(fetchPlatforms.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  }
})

export default platformsSlice.reducer
