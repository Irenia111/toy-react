class ElementWrapper {
    constructor (type) {
        // 创建根元素
        this.root = document.createElement(type)
    }
    // 配置属性
    setAttribute (name, value) {
        this.root.setAttribute(name, value)
    }
    // 添加子元素
    // 添加的是component，所以要取出传入的component的root
    appendChild (component) {
        this.root.appendChild(component.root)
    }
}
//文本节点不需要设置属性及添加子元素
class TextWrapper {
    constructor (content) {
        this.root = document.createTextNode(content)
    }
}

export class Component {
    constructor () {
        // 不需要有什么行为
        // 取到props
        this.props = Object.create(null)
        this.children = []
        // 初始化root
        this._root = null
    }
    // 把Component的属性存起来
    setAttribute (name, value) {
        this.props[name] = value
    }
    // 添加子元素
    appendChild (component) {
        this.children.push(component)
    }
    // 设置 root 的getter
    get root () {
        if (!this._root) {
            // 渲染组件，调用组件的render方法
            // 如果render之后是component，则会递归调用，直至其成为elementWrapper或者textWrapper
            this._root = this.render().root
        }
        return this._root
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
    // parentElement为实际dom
    parentElement.appendChild(component.root)
}
