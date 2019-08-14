import { useReducer, useEffect, useRef } from "react";

const NO_UPDATE_SYMBOL = Symbol("NO_UPDATE_SYMBOL");

export const Update = newState => ({ newState });

export const NoUpdate = () => NO_UPDATE_SYMBOL;

export const UpdateWithSideEffect = (newState, newSideEffect) => ({
  newState,
  newSideEffect
});

export const SideEffect = newSideEffect => ({ newSideEffect });

async function executeSideEffects({ sideEffects, state, dispatch }) {
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

function finalReducer(reducer) {
  return function(state, action) {
    if (action === NO_UPDATE_SYMBOL) {
      return state;
    }
    let { newState, newSideEffect } = reducer(state.state, action);
    const newSideEffects = newSideEffect
      ? [
          ...state.sideEffects,
          ...(Array.isArray(newSideEffect) ? newSideEffect : [newSideEffect]),
        ]
      : state.sideEffects;
    return {
      state: newState || state.state,
      sideEffects: newSideEffects
    };
  };
}

export default function useCreateReducerWithEffect(
  reducer,
  initialState,
  init
) {
  const [{ state, sideEffects }, dispatch] = useReducer(
    finalReducer(reducer),
    {
      state: initialState,
      sideEffects: []
    },
    init
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
