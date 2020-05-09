import { useReducer, useEffect, useRef, useCallback, Dispatch } from "react";

export type ReducerWithSideEffects<S, A> = (
  prevState: S,
  action: A | NoUpdateSymbol
) => Partial<StateWithSideEffects<S, A>> | NoUpdateSymbol;

export type StateWithSideEffects<S, A> = {
  state: S;
  sideEffects: SideEffect<S, A>[];
};

export type SideEffect<S, A> = (
  state: S,
  dispatch: Dispatch<A>
) => void | CancelFunc<S>;

export type CancelFunc<S> = (state: S) => void;

// for testing

export type NoUpdateSymbol = typeof NO_UPDATE_SYMBOL;
export const NO_UPDATE_SYMBOL = Symbol("NO_UPDATE_SYMBOL");

export const Update = <S>(state: S) => ({ state });

export const NoUpdate = (): NoUpdateSymbol => NO_UPDATE_SYMBOL;

export const UpdateWithSideEffect = <S, A>(
  state: S,
  sideEffects: SideEffect<S, A>[]
) => ({
  state,
  sideEffects,
});

export const SideEffect = <S, A>(sideEffects: SideEffect<S, A>[]) => ({
  sideEffects,
});

//for testing
export async function executeSideEffects<S, A>({
  sideEffects,
  state,
  dispatch,
}: {
  sideEffects: SideEffect<S, A>[];
  state: S;
  dispatch: Dispatch<A>;
}) {
  let cancelFuncs: CancelFunc<S>[] = [];
  if (sideEffects) {
    while (sideEffects.length) {
      const sideEffect = sideEffects.shift();
      const cancel = sideEffect && sideEffect(state, dispatch);
      if (cancel && typeof cancel === "function") {
        cancelFuncs.push(cancel);
      }
    }
  }
  return cancelFuncs;
}
// for testing
export function mergeState<S, A>(
  prevState: StateWithSideEffects<S, A>,
  newState: Partial<StateWithSideEffects<S, A>> | NoUpdateSymbol,
  isUpdate: boolean
): StateWithSideEffects<S, A> {
  const existingEffects = isUpdate ? prevState.sideEffects : [];

  const newSideEffects =
    newState !== NO_UPDATE_SYMBOL && newState.sideEffects
      ? [
          ...existingEffects,
          ...(Array.isArray(newState.sideEffects)
            ? newState.sideEffects
            : [newState.sideEffects]),
        ]
      : prevState.sideEffects;

  const updatedState =
    newState !== NO_UPDATE_SYMBOL && newState.state !== undefined
      ? newState.state
      : prevState.state;

  return {
    state: updatedState,
    sideEffects: newSideEffects,
  };
}

function finalReducer<S, A>(reducer: ReducerWithSideEffects<S, A>) {
  return function (
    state: StateWithSideEffects<S, A>,
    action: A | NoUpdateSymbol
  ) {
    if (action === NO_UPDATE_SYMBOL) {
      return state;
    }
    let newState = reducer(state.state, action);
    return mergeState(state, newState, true);
  };
}

export default function useCreateReducerWithEffect<S, A>(
  reducer: ReducerWithSideEffects<S, A>,
  initialState: S,
  init?: (state: S) => Partial<StateWithSideEffects<S, A>>
): [S, Dispatch<A | NoUpdateSymbol>] {
  const memoizedReducer = useCallback(finalReducer(reducer), [reducer]);

  const [{ state, sideEffects }, dispatch] = useReducer(
    memoizedReducer,
    {
      state: initialState,
      sideEffects: [],
    },
    (state: StateWithSideEffects<S, A>) =>
      typeof init === "function"
        ? mergeState(state, init(state.state), false)
        : state
  );
  let cancelFuncs = useRef<CancelFunc<S>[]>([]);
  useEffect(() => {
    if (sideEffects.length) {
      async function asyncEffects() {
        async function runSideEffects() {
          const cancels = await executeSideEffects({
            sideEffects,
            state,
            dispatch,
          });
          return cancels;
        }
        const cancels = await runSideEffects();
        cancelFuncs.current = cancels;
      }
      asyncEffects();
      if (cancelFuncs.current.length) {
        cancelFuncs.current.forEach((func) => {
          func(state);
          cancelFuncs.current = [];
        });
      }
    }
  }, [sideEffects]); //eslint-disable-line
  return [state, dispatch];
}

export function composeReducers<S, A>(
  reducers: ReducerWithSideEffects<S, A>[]
) {
  return (state: S, action: A) => {
    let reducerCount = reducers.length;
    let sideEffects: SideEffect<S, A>[] = [];
    let noUpdateCount = 0;

    const reducedResult = reducers.reduceRight(
      (prevState, reducer) => {
        // This is to handle the asymmetry in the useReducerWithSideFffect API.
        // Whereas regular reducers have a consistent API that is state in, state out
        // useReducerWithSideEffects has state in, state+sideEffects out
        const result = reducer(prevState.state, action);

        let returnValue;
        // When we do not have an update, then we increment our no-update counter and
        // return the previous state.
        if (result === NO_UPDATE_SYMBOL) {
          noUpdateCount++;

          returnValue = {
            state,
          };
        } else {
          returnValue = result;
        }

        if (
          result &&
          result !== NO_UPDATE_SYMBOL &&
          Array.isArray(result.sideEffects)
        ) {
          sideEffects = sideEffects.concat(result.sideEffects);
        }

        return returnValue;
      },
      { state, sideEffects: [] }
    );

    const noUpdateOccurred = noUpdateCount === reducerCount;

    if (noUpdateOccurred) {
      return NO_UPDATE_SYMBOL;
    }

    return {
      state: reducedResult && reducedResult.state,
      sideEffects,
    };
  };
}
