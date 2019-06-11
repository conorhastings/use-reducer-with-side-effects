import { useReducer, useEffect } from "react";

export const Update = newState => ({ newState });

export const NoUpdate = () => ({ noUpdate: true });

export const UpdateWithSideEffect = (newState, newSideEffect) => ({
  newState,
  newSideEffect: { effect: newSideEffect, id: Math.random() * 10000 }
});

export const SideEffect = newSideEffect => ({
  newSideEffect: { effect: newSideEffect, id: Math.random() * 10000 }
});

async function executeSideEffects({ sideEffects, state, dispatch }) {
  await Promise.all(
    sideEffects.forEach(sideEffect => {
      sideEffect.effect(state, dispatch);
      dispatch({
        type: "REMOVE_EXECUTED_SIDE_EFFECT",
        sideEffect
      });
    })
  );
}

function finalReducer(reducer) {
  return function({ state, sideEffects = [] }, action) {
    let { newState, newSideEffect, noUpdate } = reducer(state, action);
    let newSideEffects = sideEffects;
    newSideEffects = newSideEffect
      ? [...newSideEffects, newSideEffect]
      : newSideEffects;
    if (action.type === "REMOVE_EXECUTED_SIDE_EFFECT") {
      newSideEffects = sideEffects.filter(
        effect => effect.id !== action.sideEffect.id
      );
    } else if (noUpdate) {
      return { state, sideEffects };
    } else if (newSideEffect) {
      sideEffects = (sideEffects || []).concat(newSideEffect);
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
