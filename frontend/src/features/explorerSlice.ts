import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { ReconstructionResponse } from '../types/ocean';
import { reconstructProfile } from '../services/api';

export type ActiveView = 'landing' | 'explorer' | 'data' | 'about';

interface ExplorerState {
  currentView: ActiveView;
  selectedLocation: { lat: number; lon: number; name?: string };
  selectedDate: string;
  isInferring: boolean;
  inferenceStep: number;
  results: ReconstructionResponse | null;
  error: string | null;
}

const initialState: ExplorerState = {
  currentView: 'landing',
  selectedLocation: { lat: 18.4521, lon: 72.8314, name: 'Arabian Sea (Central)' },
  selectedDate: '2024-08-14',
  isInferring: false,
  inferenceStep: 0,
  results: null,
  error: null,
};

export const runReconstruction = createAsyncThunk(
  'explorer/runReconstruction',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = (getState() as { explorer: ExplorerState }).explorer;

      dispatch(setInferenceStep(1));
      await new Promise((r) => setTimeout(r, 400));

      dispatch(setInferenceStep(2));
      const response = await reconstructProfile({
        latitude: state.selectedLocation.lat,
        longitude: state.selectedLocation.lon,
        date: state.selectedDate,
      });

      dispatch(setInferenceStep(3));
      await new Promise((r) => setTimeout(r, 300));

      dispatch(setInferenceStep(4));
      await new Promise((r) => setTimeout(r, 200));

      return response;
    } catch (err: any) {
      console.error('Reconstruction failed:', err);
      return rejectWithValue(err.message || 'Failed to reconstruct profile');
    }
  }
);

export const explorerSlice = createSlice({
  name: 'explorer',
  initialState,
  reducers: {
    setView: (state, action: PayloadAction<ActiveView>) => {
      state.currentView = action.payload;
    },
    setLocation: (state, action: PayloadAction<{ lat: number; lon: number; name?: string }>) => {
      state.selectedLocation = action.payload;
    },
    setDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setInferenceStep: (state, action: PayloadAction<number>) => {
      state.inferenceStep = action.payload;
    },
    clearResults: (state) => {
      state.results = null;
      state.inferenceStep = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runReconstruction.pending, (state) => {
        state.isInferring = true;
        state.error = null;
      })
      .addCase(runReconstruction.fulfilled, (state, action) => {
        state.isInferring = false;
        state.results = action.payload;
        state.error = null;
      })
      .addCase(runReconstruction.rejected, (state, action) => {
        state.isInferring = false;
        state.error = (action.payload as string) || action.error.message || 'Error running reconstruction';
      });
  },
});

export const { setView, setLocation, setDate, setInferenceStep, clearResults } =
  explorerSlice.actions;
export default explorerSlice.reducer;