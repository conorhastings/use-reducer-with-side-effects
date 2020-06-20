# Use Reducer With Side Effects

[![Actions Status](https://github.com/conorhastings/react-syntax-highlighter/workflows/Node%20CI/badge.svg)](https://github.com/conorhastings/react-syntax-highlighter/actions)
[![npm version](https://img.shields.io/npm/v/use-reducer-with-side-effects.svg)](https://www.npmjs.com/package/use-reducer-with-side-effects)

React's [`useReducer`](https://reactjs.org/docs/hooks-reference.html#usereducer) hook should be given a reducer that is a pure function with no side effects. (`useReducer` might call the reducer more than once with the same initial state.) Sometimes, however, it makes sense to include network calls or other side effects within the reducer in order to keep your program logic all in one place.

  Inspired by the [`reducerComponent`](https://reasonml.github.io/reason-react/docs/en/state-actions-reducer) of `ReasonReact`, this library provides a way to declaratively declare side effects with updates, or to execute a side effect through the reducer while keeping the reducer pure.
  The general idea being that the side effects simply declare intent to execute further code, but belong with the update.
  reducers always return one of `Update`, `NoUpdate`, `UpdateWithSideEffects`, or `SideEffects` function.

 One example in which this may be useful is when dispatching a second action depends on the success of the first action, instead of waiting to find out, one can declare the side effect along side the update.
 
 ### Install
 
 * ``` npm install use-reducer-with-side-effects```
 * ``` yarn add use-reducer-with-side-effects```

### Exports

* Update - Return synchronous new state wrapped in this function for a plain update. `Update(newState)`
* NoUpdate - Indicate that there are no changes and no side effects. `NoUpdate()`
* SideEffect - Receives a callback function with `state`, and `dispatch` as arguments.  `SideEffect((state, dispatch) => { /* do something */ }`
* UpdateWithSideEffect - Very similar to `Update` and `SideEffect` combined. It takes the updated state as the first argument (as `Update`) and a side-effect callback as the second argument (as `SideEffect`). The callback function receives the updated `state` (newState) and a `dispatch`.  `UpdateWithSideEffect(newState, (state, dispatch) => { /* do something */ })`

### Default Export - useReducerWithSideEffects hook;

Nearly direct replacement to React's [useReducer](https://reactjs.org/docs/hooks-reference.html#usereducer) hook, however, the provided reducer must return the result of one of the above functions (`Update`/`NoUpdate`/`UpdateWithSideEffects`/`SideEffects`) instead of an updated object. See the [useReducer](https://reactjs.org/docs/hooks-reference.html#specifying-the-initial-state) documentation for different options on how to define the initial state.

`const [state, dispatch] = useReducerWithSideEffects(reducer, initialState, init)`

`const [state, dispatch] = useReducerWithSideEffects(reducer, {})`

### Modify Existing Reducer
If you've got an existing reducer that works with React's `useReducer` and you want to modify to use this library, do the following:

1. Modify every state change return to use `Update`. 

   old: `return {...state, foo: 'bar'}`

   new: `return Update({...state, foo: 'bar'}`

2. Modify every unchanged state return to use `NoUpdate`.

   old: `return state`

   new: `return NoUpdate()`
   
Now the reducer may be used with `useReducerWithSideEffects` and can have side effects added by using the `SideEffect` or `UpdateWithSideEffect` methods.


### Example 

#### [Code Sandbox](https://codesandbox.io/s/angry-bouman-rc2x6)

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
