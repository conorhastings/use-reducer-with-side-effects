import test from "tape";
import { renderHook, act } from "@testing-library/react-hooks";
import useCreateReducerWithEffect, * as sut from "../src";

const addOne = state => sut.Update(state + 1)
const noUpdate = state => sut.NoUpdate()
const passThru = state => sut.Update(state)
const sideEffectProducer = state => sut.UpdateWithSideEffect(state, [() => () => { }])

test("Composing reducers", t => {
    const reducers = sut.composeReducers([addOne, addOne, noUpdate, passThru])
    const { result } = renderHook(() => useCreateReducerWithEffect(reducers, 0))

    const [_, dispatch] = result.current

    act(() => dispatch()) // i.e. addOne, twice

    const [state] = result.current

    t.equal(state, 2)
    t.end()
})

test("Composing reducers with no updates returns original state", t => {
    const originalState = {}
    const reducers = sut.composeReducers([noUpdate, noUpdate])
    const { result } = renderHook(() => useCreateReducerWithEffect(reducers, originalState))

    const [_, dispatch] = result.current

    act(() => dispatch())

    const [state] = result.current

    t.equal(state, originalState)
    t.end()
})

test("Reducer which returns side effects", t => {
    const originalState = {}
    const reducers = sut.composeReducers([sideEffectProducer])
    const { result } = renderHook(() => useCreateReducerWithEffect(reducers, originalState))

    const [_, dispatch] = result.current

    act(() => dispatch())

    const [state] = result.current

    t.equal(state, originalState)
    t.end()
})