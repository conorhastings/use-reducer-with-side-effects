import { useReducer, useEffect, useRef } from "react";

const NO_UPDATE_SYMBOL = Symbol("NO_UPDATE_SYMBOL");

export const Update = state => ({ state });

export const NoUpdate = () => NO_UPDATE_SYMBOL;

export const UpdateWithSideEffect = (state, newSideEffect) => ({
  state,
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

function mergeState(prevState, changes, mergeChanges) {
  const existingEffects = mergeChanges ? prevState.sideEffects : [];

  const newSideEffects = changes.newSideEffect
      ? [
          ...existingEffects,
          ...(Array.isArray(changes.newSideEffect) ? changes.newSideEffect : [changes.newSideEffect]),
        ]
      : state.sideEffects;

  return {
    state: changes.state || prevState.state,
    sideEffects: newSideEffects
  };
}

function finalReducer(reducer) {
  return function(state, action) {
    if (action === NO_UPDATE_SYMBOL) {
      return state;
    }
    let changes = reducer(state.state, action);
    return mergeState(state, changes, true);
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
    (state) => {
      let changes;
      if (typeof init === 'function') {
        changes = init(state);
      }

      return typeof changes !== 'undefined' ? mergeState(state, changes, false) : state;
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
