export class Node {
    weight = 0
    right = null
    left = null

    constructor(parent, value) {
        this.parent = parent
        this.value = value
    }

    async incWeight() {
        this.weight += 1
    }

    static async swap(a, b) {
        if (a.parent == b.parent) {
            let tmp = a.parent.left
            a.parent.left = a.parent.right
            a.parent.right = tmp
        } else {
            let tmp = a.parent
            a.parent = b.parent
            b.parent = tmp


            if (a.parent.left == b)
                a.parent.left = a
            else
                a.parent.right = a

            if (b.parent.left == a)
                b.parent.left = b
            else
                b.parent.right = b
        }
    }
}

export class VitterTree {

    constructor(NodeT = Node) {
        this.NodeT = NodeT
        this.root = new this.NodeT(null, 'NYT')
        //TODO optimize using array
        this.nodes = {}
        this.nodes['NYT'] = this.root
    }

    //TODO optimize using HMap
    #leader(weight, inner) {
        let remaining = []
        remaining.push(this.root.right)
        remaining.push(this.root.left)

        while (remaining.length != 0) {
            let node = remaining.shift()
            if (node.value == 'IN') {
                if (inner && node.weight == weight)
                    return node
                if (node.weight > weight) {
                    remaining.push(node.right)
                    remaining.push(node.left)
                }
            } else {
                if (!inner && node.weight == weight)
                    return node
            }
        }
        return null
    }

    async #slideInc(node) {
        if (node == this.root) {
            await this.root.incWeight()
        }
        else {
            let next = node.parent
            if (node.value == 'IN') {
                let leader = this.#leader(node.weight + 1, false)
                if (leader != null) {
                    await this.NodeT.swap(node, leader)
                }
            } else {
                let leader = this.#leader(node.weight, true)
                if (leader != null && leader != node.parent) {
                    await this.NodeT.swap(node, leader)
                    next = node.parent
                }
            }

            await node.incWeight()
            return next
        }
    }

    async push(value) {
        if (!this.nodes[value]) {
            this.nodes['NYT'].right = new this.NodeT(this.nodes['NYT'])
            this.nodes['NYT'].left = new this.NodeT(this.nodes['NYT'])

            this.nodes['NYT'].right.value = value


            this.nodes['NYT'].value = 'IN'
            this.nodes[value] = this.nodes['NYT'].right
            this.nodes['NYT'] = this.nodes['NYT'].left
            this.nodes['NYT'].value = 'NYT'

        } else {
            let leader = this.#leader(this.nodes[value].weight, false)
            if (leader != null && leader != this.nodes[value]) {
                await this.NodeT.swap(this.nodes[value], leader)
            }
        }

        let node = this.nodes[value]
        while (node != null)
            node = await this.#slideInc(node)
    }
}

export class VitterEncoder extends VitterTree {
    #getCode(value) {
        let code = ''
        let node = this.nodes[value]
        if (!node)
            node = this.nodes['NYT']

        while (node != this.root) {
            if (node.parent.right == node)
                code += '1'
            else
                code += '0'
            node = node.parent
        }
        code = [...code].reverse().join('');

        if (this.nodes[value] == null)
            code += ('000000000' + value.charCodeAt(0).toString(2)).slice(-8)

        return code
    }

    async encode(text, terminate = true) {
        let encoded = ''
        for (let char of text) {
            encoded += this.#getCode(char);
            await this.push(char);
        }

        if (terminate)
            encoded += this.#getCode('NYT')
        return encoded
    }
}

export class VitterDecoder extends VitterTree {
    async decode(encoded) {
        let text = ''
        let i = 0;
        while (i < encoded.length) {
            let node = this.root
            while (node.value == 'IN') {
                if (i >= encoded.length)
                    throw 'Bad encoding'
                if (encoded[i] == '1')
                    node = node.right
                else
                    node = node.left
                i += 1
            }

            let val = node.value

            if (val == 'NYT') {
                i += 8
                if (i > encoded.length)
                    return text
                val = String.fromCharCode(`0b${encoded.slice(i - 8, i)}`)
            }

            await this.push(val);
            text += val
        }
        return text
    }
}