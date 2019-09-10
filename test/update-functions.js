import test from "tape";
import {
  Update,
  NoUpdate,
  UpdateWithSideEffect,
  SideEffect,
  NO_UPDATE_SYMBOL
} from "../src";

test("Update should take a single argumentt and return an object with the key state", t => {
  const update = Update(1);
  t.deepEqual(update, { state: 1 }, "Update correctly updates ovject state");
  t.end();
});

test("NoUpdate should return the NoUpdateSymbol", t => {
  const state = { state: 1 };
  t.is(
    NoUpdate(state),
    NO_UPDATE_SYMBOL,
    "NoUpdate correctly returns referentially equal state object"
  );
  t.end();
});

test("UpdateWithSideEffect should return a new state with a sideEffect", t => {
  function sideEffect() {}

  function reducer(state = 1, action = {}) {
    return UpdateWithSideEffect(2, sideEffect);
  }
  t.deepEqual(reducer(), { state: 2, sideEffects: sideEffect });
  t.end();
});

test("SideEffect should return a new state with a sideEffect", t => {
  function sideEffect() {}

  function reducer(state = 1, action = {}) {
    return SideEffect(sideEffect);
  }
  t.deepEqual(reducer(), { sideEffects: sideEffect });
  t.end();
});
