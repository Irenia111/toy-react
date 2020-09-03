// 通过symbol定义方法名称，保证私有性
const RENDER_TO_DOM = Symbol("render to dom")

class ElementWrapper {
    constructor (type) {
        // 创建根元素
        this.root = document.createElement(type)
    }
    // 配置属性
    setAttribute (name, value) {
        if (name.match(/^on([\s\S]+)/)){
            // 确保事件名小写，将第一个字母转换为小写
            // console.log('bind')
            // 之前拿 evemtName = RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase())
            // 将eventName传入的方式，绑定事件失败
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
        } else{
            if (name === "className"){
                this.root.setAttribute("class", value)
            } else {
                this.root.setAttribute(name, value)
            }
        }
    }

    // 支持dom重绘
    [RENDER_TO_DOM] (range) {
        range.deleteContents()
        range.insertNode(this.root)
    }

    // 由于采用了range，所以增加child也要修改
    appendChild (component) {
        let range = document.createRange()
        // 将新增的元素置于range末尾
        range.setStart(this.root, this.root.childNodes.length)
        range.setEnd(this.root, this.root.childNodes.length)
        component[RENDER_TO_DOM](range)
    }
}
//文本节点不需要设置属性及添加子元素
class TextWrapper {
    constructor (content) {
        this.root = document.createTextNode(content)
    }
    [RENDER_TO_DOM] (range) {
        // 首先从文档中移除 Range 包含的内容。
        range.deleteContents()
        //再将root插入range，完成渲染
        range.insertNode(this.root)
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

    setState (newState) {
        // state为null时的处理
        if (this.state === null || typeof this.state !== "object") {
            // 如果state为null或不是对象，直接为state赋值newState，并重新渲染组件
            this.state = newState
            this.rerender()
            return
        }

        // 采用递归的方式访问state
        let merge = (oldState, newState) => {
            for (let p in newState) {
                if ( oldState[p] === null || typeof oldState[p] !== "object") {
                    oldState[p] = newState[p]
                } else {
                    // 如果oldSate的p属性为对象，那么就递归调用merge，实现深拷贝
                    merge(oldState[p], newState[p])
                }
            }
        }

        merge(this.state, newState)
        this.rerender()
    }

    rerender () {
        // 保存this._range
        let oldRange = this._range

        // 新创建的range没有宽度，但会改变oldRange的宽度
        // 新创建的range在this._range的start处
        let range = document.createRange()
        range.setStart(oldRange.startContainer, oldRange.startOffset)
        range.setEnd(oldRange.startContainer, oldRange.startOffset)

        this[RENDER_TO_DOM](range)

        // 重设oldRange的start节点，跳过插入的range
        oldRange.setStart(range.endContainer, range.endOffset)
        // 清除oldRange的内容
        oldRange.deleteContents()
    }

    // [RENDER_TO_DOM]方法保留了this._range
    [RENDER_TO_DOM] (range) {
        this._range = range
        this.render()[RENDER_TO_DOM](range)
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
