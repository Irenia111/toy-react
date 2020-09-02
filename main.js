import { Component, createElement, render } from "./toy-react.js"

console.log('hi')
/* test */
class MyComponent extends Component {
    constructor() {
        super()
        this.state = {
            a: 1,
            b: 1
        }
    }
    render () {
        return <div>
            <h1>myComponent</h1>
            <span>a: {this.state.a.toString()}</span>
            <span>b: {this.state.b.toString()}</span>
            <button onClick={() => {
                // console.log('click')
                this.state.a += 1
                this.rerender()
            }}>a + 1</button>
            {this.children}
        </div>
    }
}

render(<MyComponent id="a" class="c">
    <h2>I am child</h2>
</MyComponent>, document.body)
