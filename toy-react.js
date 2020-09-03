// 通过symbol定义方法名称，保证私有性
const RENDER_TO_DOM = Symbol("render to dom")

function replaceContent(range, node) {
    // 将node插入range，此时node在range的最前位置
    range.insertNode(node)

    // range挪到node之后
    range.setStartAfter(node)
    // 清空range
    range.deleteContents()

    // 重设range的位置
    range.setStartBefore(node)
    range.setEndAfter(node)
}

export class Component {
    constructor () {
        // 不需要有什么行为
        // 取到props
        this.props = Object.create(null)
        this.children = []
        this._root = null
        this._range = null
    }
    // 把Component的属性存起来
    setAttribute (name, value) {
        this.props[name] = value
    }
    // 添加子元素
    appendChild (component) {
        this.children.push(component)
    }

    get vdom () {
        return this.render().vdom
    }

    // [RENDER_TO_DOM]方法保留了this._range
    [RENDER_TO_DOM] (range) {
        this._range = range
        this._vdom = this.vdom
        this._vdom[RENDER_TO_DOM](range)
    }
    update () {
        console.log('update')

        let isSameNode = (oldNode, newNode) => {

            // type不同，则为不同节点
            if (oldNode.type !== newNode.type) {
                return false
            }

            // props不同，则为不同节点
            for ( let name in newNode.props) {
                // 属性值要相同
                if (newNode.props[name] !== oldNode.props[name]) {
                    return false
                }
            }
            // props的长度不相同，节点不相同
            if (Object.keys(oldNode.props).length > Object.keys(newNode.props)) {
                return false
            }

            // 文本节点，比对content
            if (newNode.type === "#text") {
                if (newNode.content !== oldNode.content) {
                    return false
                }
            }
            return true
        }

        let update = (oldNode, newNode) => {
            // 根节点不同，则全部重新渲染
            if (!isSameNode(oldNode, newNode)) {
                // 替换oldNode
                newNode[RENDER_TO_DOM](oldNode._range)
                return
            }
            newNode._range = oldNode._range

            // children的处理
            // 因为children属性是实体dom，所以我们要拿到vchildren
            let newChildren = newNode.vchildren
            let oldChildren = oldNode.vchildren

            if (!newChildren || !newChildren.length) {
                return
            }

            // 记录oldChildren的尾部位置
            let tailRange = oldChildren[oldChildren.length - 1]._range
            // 两个数组一起循环，所以不用 for of循环
            for (let i = 0; i < newChildren.length; i++) {
                let newChild = newChildren[i]
                let oldChild = oldChildren[i]
                if (i < oldChildren.length) {
                    update(oldChild, newChild)
                } else {
                    // 如果newChild比oldChild元素多，我们需要在newChild进行节点插入
                    // 创建一个需要插入的range
                    let range = document.createRange()
                    range.setStart(tailRange.endContainer, tailRange.endOffset)
                    range.setEnd(tailRange.endContainer, tailRange.endOffset)
                    newChild[RENDER_TO_DOM](range)
                    tailRange = range
                }
            }
        }
        // 保存新的vdom
        let vdom = this.vdom
        // 对比vdom
        update(this._vdom, vdom)
        // 重新赋值
        this._vdom = vdom
    }
    setState (newState) {
        console.log('setState')
        // state为null时的处理
        if (this.state === null || typeof this.state !== "object") {
            // 如果state为null或不是对象，直接为state赋值newState，并重新渲染组件
            this.state = newState
            this.update()
            return
        }

        // 采用递归的方式访问state
        let merge = (oldState, newState) => {
            for (let p in newState) {
<<<<<<< HEAD
                if (oldState[p] === null || typeof oldState[p] !== "object") {
=======
                if ( oldState[p] === null || typeof oldState[p] !== "object") {
>>>>>>> e12e9c15d26eb06ef35675e8d410df32df0f70c6
                    oldState[p] = newState[p]
                } else {
                    // 如果oldSate的p属性为对象，那么就递归调用merge，实现深拷贝
                    merge(oldState[p], newState[p])
                }
            }
        }

        merge(this.state, newState)
        this.update()
    }

}

class ElementWrapper extends Component {
    constructor (type) {
        super(type)
        this.type = type
    }

    get vdom () {
        this.vchildren = this.children.map(child => child.vdom)
        return this
    }

    // 支持dom重绘
    [RENDER_TO_DOM] (range) {
        this._range = range
        // 通过replaceContent代替初始时range.deleteContents()
        // range.deleteContents()

        let root = document.createElement(this.type)

        for (let name in this.props) {
            let value = this.props[name]
            if (name.match(/^on([\s\S]+)/)){
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
            } else{
                if (name === "className"){
                    root.setAttribute("class", value)
                } else {
                    root.setAttribute(name, value)
                }
            }
        }

        for (let child of this.children) {
            let childRange = document.createRange()
            childRange.setStart(root, root.childNodes.length)
            childRange.setEnd(root, root.childNodes.length)
            child[RENDER_TO_DOM](childRange)
        }

        // 完成root的挂载
        replaceContent(range, root)

    }

}
//文本节点不需要设置属性及添加子元素
class TextWrapper extends Component {
    constructor (content) {
        super(content)
        this.type = "#text",
        this.content = content
    }
    get vdom () {
        return this
    }
    [RENDER_TO_DOM] (range) {
        this._range = range
        let root = document.createTextNode(this.content)
        replaceContent(range, root)
    }
}

export function createElement (tagType, attributes, ...children) {
    let e

    if (typeof tagType === "string") {
        // 如果是小写的tagName，则生成ElementWrapper对象
        e = new ElementWrapper(tagType)
    } else {
        // 如果是组件，则生成对应的组件对象
        e = new tagType
    }

    for (let i in attributes) {
        // 调用元素的setAttribute方法
        e.setAttribute(i, attributes[i])
    }

    let insertChildren = (children) => {
        for (let child of children) {

            if (child === null) {
                continue
            }

            // 如果child是文本节点
            if (typeof child === "string") {
                // 构造文本节点元素
                child = new TextWrapper(child)
            }

            // 当child是数组的时候，即component中的children，需要展开child
            if (typeof child === "object" && child instanceof Array) {
                // 递归调用
                insertChildren(child)
            } else {
                // 调用元素的appendChild方法
                e.appendChild(child)
            }

        }
    }

    insertChildren(children)

    return e
}

export function render (component, parentElement) {
    // 在parentElement尾部增加range
    let range = document.createRange()

    // 将range的start节点设置为parentElement，offset为0，说明range将包含parentElement的全部children
    range.setStart(parentElement, 0)

    // 因为parentElement中会有文本节点和注释节点，所以offset不是parentElement.children.length
    range.setEnd(parentElement, parentElement.childNodes.length)

    // 清空range
    range.deleteContents()

    // 调用[RENDER_TO_DOM]方法
    component[RENDER_TO_DOM](range)
}
