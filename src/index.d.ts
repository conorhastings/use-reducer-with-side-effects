// NOTE: These are from here: https://github.com/conorhastings/use-reducer-with-side-effects/issues/36#issuecomment-599120355
declare module 'use-reducer-with-side-effects' {
  export type ReducerReturn<ReducerState, ReducerActions> =
    | symbol
    | UpdateReturn<ReducerState>
    | SideEffectReturn<ReducerState, ReducerActions>
    | UpdateWithSideEffectReturn<ReducerState, ReducerActions>

  export type Reducer<ReducerState, ReducerActions> = (
    state: ReducerState,
    action: ReducerActions
  ) => ReducerReturn<ReducerState, ReducerActions>

  export type Dispatch<ReducerActions> = (action: ReducerActions) => void

  export interface StateShape<ReducerState> {
    sideEffects: any[]
    state: ReducerState
  }

  export type CancelFunction = () => void
  export type SideEffectCallback<ReducerState, ReducerActions> = (
    state: ReducerState,
    dispatch: Dispatch<ReducerActions>
  ) => void | CancelFunction

  export function NoUpdate(): symbol

  export interface SideEffectReturn<ReducerState, ReducerActions> {
    sideEffects: SideEffectCallback<ReducerState, ReducerActions>[]
  }

  export function SideEffect<ReducerState, ReducerActions>(
    args:
      | SideEffectCallback<ReducerState, ReducerActions>[]
      | SideEffectCallback<ReducerState, ReducerActions>
  ): SideEffectReturn<ReducerState, ReducerActions>

  export interface UpdateReturn<ReducerState> {
    state: ReducerState
  }

  export function Update<ReducerState>(
    state: ReducerState
  ): UpdateReturn<ReducerState>

  export interface UpdateWithSideEffectReturn<ReducerState, ReducerActions> {
    state: ReducerState
    sideEffects: SideEffectCallback<ReducerState, ReducerActions>[]
  }

  export function UpdateWithSideEffect<ReducerState, ReducerActions>(
    state: any,
    sideEffects:
      | SideEffectCallback<ReducerState, ReducerActions>[]
      | SideEffectCallback<ReducerState, ReducerActions>
  ): UpdateWithSideEffectReturn<ReducerState, ReducerActions>

  export default function useCreateReducerWithEffect<
    ReducerState,
    ReducerActions
  >(
    reducer: Reducer<ReducerState, ReducerActions>,
    initializerArg: ReducerState,
    initializer?: (args: StateShape<ReducerState>) => StateShape<ReducerState>
  ): [ReducerState, Dispatch<ReducerActions>]
}
