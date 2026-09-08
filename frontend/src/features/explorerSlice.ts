import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { ReconstructionResponse } from '../types/ocean';
import { simulateInference } from '../lib/mockEngine';

export type ActiveView = 'landing' | 'explorer' | 'data' | 'about';

interface ExplorerState {
  currentView: ActiveView;
  selectedLocation: { lat: number; lon: number; name?: string };
  selectedDate: string;
  isInferring: boolean;
  inferenceStep: number;
  results: ReconstructionResponse | null;
}

const initialState: ExplorerState = {
  currentView: 'landing',
  selectedLocation: { lat: 18.4521, lon: 72.8314, name: 'Arabian Sea (Central)' },
  selectedDate: '2026-08-14',
  isInferring: false,
  inferenceStep: 0,
  results: null,
};

export const runReconstruction = createAsyncThunk(
  'explorer/runReconstruction',
  async (_, { getState, dispatch }) => {
    const state = (getState() as { explorer: ExplorerState }).explorer;

    dispatch(setInferenceStep(1));
    await new Promise((r) => setTimeout(r, 600));

    dispatch(setInferenceStep(2));
    await new Promise((r) => setTimeout(r, 700));

    dispatch(setInferenceStep(3));
    const response = await simulateInference(
      state.selectedLocation.lat,
      state.selectedLocation.lon,
      state.selectedDate
    );

    dispatch(setInferenceStep(4));
    await new Promise((r) => setTimeout(r, 500));

    return response;
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
      })
      .addCase(runReconstruction.fulfilled, (state, action) => {
        state.isInferring = false;
        state.results = action.payload;
      })
      .addCase(runReconstruction.rejected, (state) => {
        state.isInferring = false;
      });
  },
});

export const { setView, setLocation, setDate, setInferenceStep, clearResults } =
  explorerSlice.actions;
export default explorerSlice.reducer;