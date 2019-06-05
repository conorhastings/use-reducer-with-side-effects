import { useState, useMemo } from "react";

export const Update = newState => ({ setState }) => {
  setState(newState);

  return newState;
};

export const NoUpdate = () => ({ state }) => state;

export const UpdateWithSideEffect = (newState, sideEffect) => ({
  state,
  setState,
  reducer
}) => {
  const updatedState = Update(newState)({ setState });

  sideEffect(newState, action => {
    const reducerReturn = reducer(newState, action);
    reducerReturn({ state: updatedState, setState, reducer });
  });
};

export const SideEffect = sideEffect => ({ state, reducer, setState }) =>
  sideEffect(state, action => {
    const reducerReturn = reducer(state, action);
    reducerReturn({ state, setState, reducer });
  });

export default function useCreateReducerWithEffect(reducer, initialState) {
  const [state, setState] = useState(initialState);

  const dispatch = useMemo(
    () => action => {
      const reducerReturn = reducer(state, action);
      if (typeof reducerReturn === "function") {
        reducerReturn({ state, setState, reducer });
      } else {
        setState(reducerReturn);
      }
    },

    [state, reducer]
  );
  return { state, dispatch };
}
