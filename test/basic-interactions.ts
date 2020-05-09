import * as test from "tape";
import { renderHook, act } from "@testing-library/react-hooks";
import useCreateReducerWithEffect, * as sut from "../src";

type State = typeof initialState;

type Action = {
  NoUpdate?: boolean;
  Update?: boolean;
  UpdateWithSideEffect?: boolean;
  SideEffect?: boolean;
  SideEffected?: boolean;
};

const initialState = { updated: false, sideEffected: false };

const sideEffect: sut.SideEffect<State, Action> = (_, dispatch) =>
  dispatch({ SideEffected: true });

const reducer: sut.ReducerWithSideEffects<State, Action> = (state, action) => {
  if (action === sut.NO_UPDATE_SYMBOL) return sut.NoUpdate();

  const { Update, UpdateWithSideEffect, SideEffect, SideEffected } = action;

  if (Update) return sut.Update({ ...state, updated: true });

  if (UpdateWithSideEffect)
    return sut.UpdateWithSideEffect({ ...state, updated: true }, [sideEffect]);

  if (SideEffect) return sut.SideEffect([sideEffect]);

  if (SideEffected) return sut.Update({ ...state, sideEffected: true });

  return sut.NoUpdate();
};

function dispatchAction(action: Action | sut.NoUpdateSymbol) {
  const { result } = renderHook(() =>
    useCreateReducerWithEffect(reducer, initialState)
  );

  const [_, dispatch] = result.current;

  act(() => dispatch(action));

  return result.current;
}

test("No update", (t) => {
  const [state] = dispatchAction({ NoUpdate: true });
  t.isEquivalent(state, initialState);
  t.end();
});

test("Update", (t) => {
  const [state] = dispatchAction({ Update: true });
  t.isEquivalent(state, { ...initialState, updated: true });
  t.end();
});

test("UpdateWithSideEffect", (t) => {
  const [state] = dispatchAction({ UpdateWithSideEffect: true });
  t.isEquivalent(state, { ...initialState, updated: true, sideEffected: true });
  t.end();
});

test("SideEffect", (t) => {
  const [state] = dispatchAction({ SideEffect: true });
  t.isEquivalent(state, { ...initialState, sideEffected: true });
  t.end();
});

test("Init function", (t) => {
  const { result } = renderHook(() =>
    useCreateReducerWithEffect(
      reducer,
      { updated: false, sideEffected: false },
      (state) => sut.Update({ ...state, updated: !state.updated })
    )
  );
  const [state] = result.current;

  t.deepEqual(state, { updated: true, sideEffected: false });
  t.end();
});

test("Disptaching NoUpdate returns original state", (t) => {
  const [state] = dispatchAction(sut.NoUpdate());
  t.equal(state, initialState);
  t.end();
});
