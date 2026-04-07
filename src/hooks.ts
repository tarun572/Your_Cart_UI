/**
 * Custom Redux Hooks
 * Type-safe hooks for using Redux in the application
 */

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.bind(null) as <T>(selector: (state: RootState) => T) => T;
