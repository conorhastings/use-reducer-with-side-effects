# Use Reducer With Side Effects
<p>
  Inspired by the <a href="https://reasonml.github.io/reason-react/docs/en/state-actions-reducer">`reducerComponent`</a> of `ReasonReact` , this provides a way to declaratively declare side effects with updates, or to execute a side effect through the reducer while keeping the reducer pure.
  The general idea being that the side effects simply declare intent to execute further code, but belong with the update.
  reducers always return one of `Update`, `NoUpdate`, `UpdateWithSideEffects`, or `SideEffects` function.
</p>

<p>
 One example in which this may be useful is when dispatching a second action depends on the success of the first action, instead of waiting to find out, one can declare the side effect along side the update.
</p>

### Exports

* Update - Return synchronous new state wrapped in this function for a plain update. `Update(newState)`
* NoUpdate - Instead of just returning state when nothing should occur, return NoUpdate() to allow hook to know no update will be taking place.
* UpdateWithSideEffects - Very similar to update except it takes a second argument, a callback function receiving the newState and dispatch. 
* SideEffects - simply receives a callback function with state, and dispatch as arguemnts.

### Default Export - useReducerWithSideEffects(reducer, initialState);

Outside of returning the functions of above inside you're reducer this should function almost identically to the built in useReducer.

### Example -

#### <a href="https://codesandbox.io/s/angry-bouman-rc2x6">Code Sandbox</a>

```jsx
import React from "react";
import ReactDOM from "react-dom";
import useReducerWithSideEffect, {
  Update,
  NoUpdate,
  UpdateWithSideEffect,
  SideEffect
} from "./useReducerWithSideEffect";

import "./styles.css";

function reducer(state, action = {}) {
  if (action.type === "ADDTHENSUBTRACT2") {
    return UpdateWithSideEffect(state + action.increment, (_, dispatch) => {
      setTimeout(() => dispatch({ type: "SUBTRACT", decrement: 2 }), 3000);
    });
  } else if (action.type === "SUBTRACT") {
    return Update(state - action.decrement);
  } else if (action.type === "MULTIPLYAFTERFIVESECONDS") {
    return SideEffect((state, dispatch) =>
      setTimeout(
        () =>
          dispatch({
            type: "ADDTHENSUBTRACT2",
            increment: state * action.multiplier
          }),
        5000
      )
    );
  } else {
    return NoUpdate();
  }
}

function App() {
  const { state, dispatch } = useReducerWithSideEffect(reducer, 0);
  return (
    <div className="App">
      <button
        onClick={() => dispatch({ type: "ADDTHENSUBTRACT2", increment: 5 })}
      >
        click
      </button>
      <br />
      <button
        onClick={() =>
          dispatch({ type: "MULTIPLYAFTERFIVESECONDS", multiplier: 5 })
        }
      >
        Multiply after Five Seconds
      </button>
      {state}
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
```
 
 
