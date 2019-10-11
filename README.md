# Use Reducer With Side Effects

[![Actions Status](https://github.com/conorhastings/react-syntax-highlighter/workflows/Node%20CI/badge.svg)](https://github.com/conorhastings/react-syntax-highlighter/actions)
[![npm version](https://img.shields.io/npm/v/use-reducer-with-side-effects.svg)](https://www.npmjs.com/package/use-reducer-with-side-effects)

  Inspired by the <a href="https://reasonml.github.io/reason-react/docs/en/state-actions-reducer">`reducerComponent`</a> of `ReasonReact`, this provides a way to declaratively declare side effects with updates, or to execute a side effect through the reducer while keeping the reducer pure.
  The general idea being that the side effects simply declare intent to execute further code, but belong with the update.
  reducers always return one of `Update`, `NoUpdate`, `UpdateWithSideEffects`, or `SideEffects` function.

 One example in which this may be useful is when dispatching a second action depends on the success of the first action, instead of waiting to find out, one can declare the side effect along side the update.
 
 ### Install
 
 * ``` npm install use-reducer-with-side-effects```
 * ``` yarn add use-reducer-with-side-effects```

### Exports

* Update - Return synchronous new state wrapped in this function for a plain update. `Update(newState)`
* NoUpdate - Instead of just returning state when nothing should occur, return NoUpdate() to allow hook to know no update will be taking place.
* UpdateWithSideEffects - Very similar to update except it takes a second argument, a callback function receiving the newState and dispatch. 
* SideEffects - simply receives a callback function with state, and dispatch as arguemnts.

### Default Export - useReducerWithSideEffects(reducer, initialState);

Outside of returning the functions of above inside you're reducer this should function almost identically to the built in useReducer.

### Example 

#### <a href="https://codesandbox.io/s/angry-bouman-rc2x6">Code Sandbox</a>

#### A comparison using an adhoc use effect versus this library

##### adhoc 
```jsx
import React, { useReducer } from 'react';

function Avatar({ userName }) {
  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case FETCH_AVATAR: {
          return { ...state, fetchingAvatar: true };
        }
        case FETCH_AVATAR_SUCCESS: {
          return { ...state, fetchingAvatar: false, avatar: action.avatar };
        }
        case FETCH_AVATAR_FAILURE: {
          return { ...state, fetchingAvatar: false };
        }
      }
    },
    { avatar: null }
  );

  useEffect(() => {
    dispatch({ type: FETCH_AVATAR });
    fetch(`/avatar/${userName}`).then(
      avatar => dispatch({ type: FETCH_AVATAR_SUCCESS, avatar }),
      dispatch({ type: FETCH_AVATAR_FAILURE })
    );
  }, [userName]);

  return <img src={!state.fetchingAvatar && state.avatar ? state.avatar : DEFAULT_AVATAR} />
}
```
Library with colocated async action
```jsx
import useReducerWithSideEffects, { UpdateWithSideEffect, Update } from 'use-reducer-with-side-effects';

function Avatar({ userName }) {
  const [{ fetchingAvatar, avatar }, dispatch] = useReducerWithSideEffects(
    (state, action) => {
      switch (action.type) {
        case FETCH_AVATAR: {
          return UpdateWithSideEffect({ ...state, fetchingAvatar: true }, (state, dispatch) => { // the second argument can also be an array of side effects
                fetch(`/avatar/${userName}`).then(
                  avatar =>
                    dispatch({
                      type: FETCH_AVATAR_SUCCESS,
                      avatar
                    }),
                  dispatch({ type: FETCH_AVATAR_FAILURE })
                );
          });
        }
        case FETCH_AVATAR_SUCCESS: {
          return Update({ ...state, fetchingAvatar: false, avatar: action.avatar });
        }
        case FETCH_AVATAR_FAILURE: {
          return Update({ ...state, fetchingAvatar: false })
        }
      }
    },
    { avatar: null }
  );

  useEffect(() => dispatch({ type: FETCH_AVATAR }) , [userName]);

  return <img src={!fetchingAvatar && avatar ? avatar : DEFAULT_AVATAR} />;
}
```
