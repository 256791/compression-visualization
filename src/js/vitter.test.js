import { VitterDecoder, VitterEncoder, VitterTree } from './vitter.mjs'

test('Nodes of higher weight precedes nodes with lower weight', async () => {
    let tree = new VitterTree();
    let text = "ADAADDDCCCCCCAAAAA"
    for (let el of text) {
        await tree.push(el)

        let last = tree.root.weight
        let remaining = []
        remaining.push(tree.root)
        while (remaining.length != 0) {
            let node = remaining.shift()

            expect(node.weight).toBeLessThanOrEqual(last)
            last = node.weight

            if (node.value == 'IN') {
                remaining.push(node.right);
                remaining.push(node.left);
            }
        }
    }
})


test('Leaf nodes precedes internal nodes of the same weight', async () => {
    let tree = new VitterTree();
    let text = "ADAADDDCCCCCCAAAAA"
    for (let el of text) {
        await tree.push(el)

        let last = tree.root
        let remaining = []
        remaining.push(tree.root)
        while (remaining.length != 0) {
            let node = remaining.shift()
            if (node.weight == last.weight)
                expect(node.value == 'IN' && last.value != 'IN').toBeFalsy()
            last = node

            if (node.value == 'IN') {
                remaining.push(node.right);
                remaining.push(node.left);
            }
        }
    }
})



test('Encoded then decoded text are be same as oryginal', async () => {
    let text = "ADAADDDCCCCCCAAAAA"

    let encoder = new VitterEncoder()
    let encoded = await encoder.encode(text)

    let decoder = new VitterDecoder()
    let decoded = await decoder.decode(encoded)
    expect(decoded).toEqual(text)
})

test('Encoding and decoding without termination (part of text)', async () => {
    let text = "AD"

    let encoder = new VitterEncoder()
    let encoded = await encoder.encode(text, false)

    let decoder = new VitterDecoder()
    let decoded = await decoder.decode(encoded)
    expect(decoded).toEqual(text)
})

test('Decoding bad encoded block throws error', async () => {
    let text = "AD"

    let encoder = new VitterEncoder()
    let encoded = await encoder.encode(text, false)

    let decoder = new VitterDecoder()
    await expect(decoder.decode(encoded + encoded)).rejects.toEqual('Bad encoding');
})