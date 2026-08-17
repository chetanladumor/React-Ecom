/**
 * @file src/store/hooks.ts
 * @description Custom typed React-Redux hooks.
 *
 * @why-it-exists
 * Out-of-the-box `useDispatch` and `useSelector` hooks are untyped. Creating pre-typed versions prevents us 
 * from having to import `RootState` and `AppDispatch` types in every single functional component.
 *
 * @why-this-approach
 * - Defines `useAppDispatch` and `useAppSelector` with typed signatures derived from our store's root definition.
 *
 * @alternative-approaches
 * - Standard untyped hooks: `const dispatch = useDispatch()` requires casting or ignores typescript safety, which increases bug surface area.
 *
 * @enterprise-considerations
 * - Typings: Maintains strict type-safety across features, making refactoring store structures safe.
 */

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index.ts';

// Pre-typed dispatch hook for async actions
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

// Pre-typed selector hook for reading state properties
export const useAppSelector = useSelector.withTypes<RootState>();
