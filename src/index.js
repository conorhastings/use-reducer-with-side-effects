import { useReducer, useEffect } from "react";

const NO_UPDATE_SYMBOL = Symbol("NO_UPDATE_SYMBOL");

const REMOVE_EXECUTED_SIDE_EFFECT = Symbol("REMOVE_EXECUTED_SIDE_EFFECT");

export const Update = newState => ({ newState });

export const NoUpdate = () => NO_UPDATE_SYMBOL;

export const UpdateWithSideEffect = (newState, newSideEffect) => ({
  newState,
  newSideEffect: { effect: newSideEffect, id: Math.random() * 10000 }
});

export const SideEffect = newSideEffect => ({
  newSideEffect: { effect: newSideEffect, id: Math.random() * 10000 }
});

async function executeSideEffects({ sideEffects, state, dispatch }) {
  await (sideEffects && sideEffects.length
    ? Promise.all(
        sideEffects.forEach(sideEffect => {
          sideEffect.effect(state, dispatch);
          dispatch({
            type: REMOVE_EXECUTED_SIDE_EFFECT,
            sideEffect
          });
        })
      )
    : Promise.resolve([]));
}

function finalReducer(reducer) {
  return function({ state, sideEffects = [] }, action) {
    let { newState, newSideEffect } = reducer(state, action);
    let newSideEffects = sideEffects;
    newSideEffects = newSideEffect
      ? [...newSideEffects, newSideEffect]
      : newSideEffects;
    if (action.type === REMOVE_EXECUTED_SIDE_EFFECT) {
      newSideEffects = sideEffects.filter(
        effect => effect.id !== action.sideEffect.id
      );
    } else if (action === NO_UPDATE_SYMBOL) {
      return { state, sideEffects };
    }
    return { state: newState || state, sideEffects: newSideEffects };
  };
}

export default function useCreateReducerWithEffect(reducer, initialState) {
  const [{ state, sideEffects }, dispatch] = useReducer(finalReducer(reducer), {
    state: initialState,
    sideEffects: []
  });
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
