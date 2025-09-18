import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
// import { combine } from './constants/utils'
import { combineArrow, transformToObjects } from './constants/utils'
function App() {
  const [count, setCount] = useState(0)
  const result = combineArrow(10,20,30);
  console.log(result);
  const user = {
    name: 'John',
    age: 30,
    city: 'New York'
  }
  const {name, age, city} = user;
  console.log(name, age, city);
  console.log(transformToObjects([1,2,3,4,5]),"arrayObject");

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
