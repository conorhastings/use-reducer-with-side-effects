import { useReducer, useEffect } from "react";

const NO_UPDATE_SYMBOL = Symbol("NO_UPDATE_SYMBOL");

export const Update = newState => ({ newState });

export const NoUpdate = () => NO_UPDATE_SYMBOL;

export const UpdateWithSideEffect = (newState, newSideEffect) => ({
  newState,
  newSideEffect
});

export const SideEffect = newSideEffect => ({ newSideEffect });

async function executeSideEffects({ sideEffects, state, dispatch }) {
  if (sideEffects) {
    while (sideEffects.length) {
      const sideEffect = sideEffects.shift();
      sideEffect(state, dispatch);
    }
  }
  return Promise.resolve();
}

function finalReducer(reducer) {
  return function(state, action) {
    if (action === NO_UPDATE_SYMBOL) {
      return state;
    }
    let { newState, newSideEffect } = reducer(state.state, action);
    const newSideEffects = newSideEffect
      ? [...state.sideEffects, newSideEffect]
      : state.sideEffects;
    return { state: newState || state.state, sideEffects: newSideEffects };
  };
}

export default function useCreateReducerWithEffect(reducer, initialState, init) {
  const [{ state, sideEffects }, dispatch] = useReducer(finalReducer(reducer), {
    state: initialState,
    sideEffects: []
  }, init);
  useEffect(() => {
    if (sideEffects.length) {
      async function runSideEffects() {
        await executeSideEffects({ sideEffects, state, dispatch });
      }
      runSideEffects();
    }
  }, [sideEffects]); //eslint-disable-line
  return [state, dispatch];
}
