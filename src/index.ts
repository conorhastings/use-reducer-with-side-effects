import { useReducer, useEffect, useRef, useCallback } from "react";

// for testing
export const NO_UPDATE_SYMBOL = Symbol("NO_UPDATE_SYMBOL");

export const Update = state => ({ state });

export const NoUpdate = () => NO_UPDATE_SYMBOL;

export const UpdateWithSideEffect = (state, sideEffects) => ({
  state,
  sideEffects
});

export const SideEffect = sideEffects => ({ sideEffects });

//for testing
export async function executeSideEffects({ sideEffects, state, dispatch }) {
  let cancelFuncs = [];
  if (sideEffects) {
    while (sideEffects.length) {
      const sideEffect = sideEffects.shift();
      const cancel = sideEffect(state, dispatch);
      if (cancel && typeof cancel === "function") {
        cancelFuncs.push(cancel);
      }
    }
  }
  return Promise.resolve(cancelFuncs);
}
// for testing
export function mergeState(prevState, newState, isUpdate) {
  const existingEffects = isUpdate ? prevState.sideEffects : [];

  const newSideEffects = newState.sideEffects
      ? [
          ...existingEffects,
          ...(Array.isArray(newState.sideEffects) ? newState.sideEffects : [newState.sideEffects]),
        ]
      : prevState.sideEffects;
  
  const hasNewState =
    typeof newState.hasOwnProperty === 'function' &&
    newState.hasOwnProperty('state');

  let updatedState;
  if (isUpdate) {
    updatedState = hasNewState ? newState.state : prevState.state;
  } else {
    updatedState = newState.state;
  }

  return {
    state: updatedState,
    sideEffects: newSideEffects
  };
}

function finalReducer(reducer) {
  return function(state, action) {
    if (action === NO_UPDATE_SYMBOL) {
      return state;
    }
    let newState = reducer(state.state, action);
    return mergeState(state, newState, true);
  };
}

export default function useCreateReducerWithEffect(
  reducer,
  initialState,
  init
) {
  const memoizedReducer = useCallback(finalReducer(reducer), [reducer]);

  const [{ state, sideEffects }, dispatch] = useReducer(
    memoizedReducer,
    {
      state: initialState,
      sideEffects: []
    },
    (state) => {
      let newState;
      if (typeof init === 'function') {
        newState = init(state);
      }

      return typeof newState !== 'undefined' ? mergeState(state, newState, false) : state;
    }
  );
  let cancelFuncs = useRef([]);
  useEffect(() => {
    if (sideEffects.length) {
      async function asyncEffects() {
        async function runSideEffects() {
          const cancels = await executeSideEffects({
            sideEffects,
            state,
            dispatch
          });
          return cancels;
        }
        const cancels = await runSideEffects();
        cancelFuncs.current = cancels;
      }
      asyncEffects();
      if (cancelFuncs.current.length) {
        cancelFuncs.current.forEach(func => {
          func(state);
          cancelFuncs.current = [];
        });
      }
    }
  }, [sideEffects]); //eslint-disable-line
  return [state, dispatch];
}

export function composeReducers(reducers) {
  return (state, action) => {
    let reducerCount = reducers.length;
    let sideEffects = [];
    let noUpdateCount = 0;

    const reducedResult = reducers.reduceRight((prevState, reducer, index) => {
      // This is to handle the asymmetry in the useReducerWithSideFffect API.
      // Whereas regular reducers have a consistent API that is state in, state out
      // useReducerWithSideEffects has state in, state+sideEffects out
      let state;
      if (index === reducerCount - 1) {
        state = prevState;
      } else {
        state = prevState.state;
      }

      const result = reducer(state, action);

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

      if (result && Array.isArray(result.sideEffects)) {
        sideEffects = sideEffects.concat(result.sideEffects);
      }

      return returnValue;
    }, state);

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
