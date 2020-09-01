import { Component, createElement, render } from "./toy-react";


class MyComponent extends Component {
    render () {
        return <div>
            <h1>myComponent</h1>
            {this.children}
        </div>
    }
}

render(<MyComponent id="a" class="c">
    <h2>ssss</h2>
</MyComponent>, document.body)
