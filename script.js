const SECOND_IN_MS = 1000
const SECTION_PROCESS_DELAY = Math.floor(SECOND_IN_MS / 60)
const SECTION_LENGTH_INFELICITY = 0.2
const TEST_ARRAY_LENGTH = 10000
const ITERATION_COMPLEXITY = 200000

const macrotask = callback => (...args) => setTimeout(() => callback(...args), 0)
const toMacrotaskQueue = callback => setTimeout(callback, 0)

const mapWithPerformanceCheck = (
    elements,
    iterator,
    from,
    to
) => new Promise(resolve => toMacrotaskQueue(() => {
    const results = []
    const start = performance.now()

    for (let i = from; i < Math.min(elements.length, to); i++) {
        results.push(iterator(elements[i], i, elements))
    }

    const delay = (performance.now() - start) || 1

    resolve([results, delay])
}))

const mapWithPermissibleSectionLengthCheck = (
    elements,
    iterator,
    sectionProcessDelay
) => new Promise(resolve => {
    const results = [iterator(elements[0], 0, elements)] // warming up the compiler

    let sectionLength = results.length

    const iterate = macrotask(() => {
        const from = results.length
        const to = Math.min(elements.length, from + sectionLength)

        mapWithPerformanceCheck(elements, iterator, from, to).then(([section, delay]) => {
            for (const element of section) results.push(element)

            sectionLength = Math.min(elements.length, sectionLength * (sectionProcessDelay / delay))

            const isEnoughToCalc = delay > sectionProcessDelay / 2

            if (!isEnoughToCalc && sectionLength < elements.length) {
                iterate()
            } else {
                sectionLength = Math.floor(sectionLength * (1 - SECTION_LENGTH_INFELICITY))
                resolve([results, sectionLength || 1])
            }
        })
    })

    iterate()
})

const chunk = (
    elements,
    iterator,
    sectionProcessDelay = SECTION_PROCESS_DELAY
) => new Promise(resolve => {
    const iterate = macrotask((results, sectionLength) => {
        const from = results.length
        const to = Math.min(elements.length, from + sectionLength)

        for (let i = from; i < to; i++) results.push(iterator(elements[i], i, elements))

        if (to < elements.length) {
            iterate(results, sectionLength)
        } else resolve(results)
    })

    mapWithPermissibleSectionLengthCheck(elements, iterator, sectionProcessDelay)
        .then(([results, sectionLength]) => {
            console.log(`Section length:`, sectionLength)
            iterate(results, sectionLength)
        })
})

const elements = new Array(TEST_ARRAY_LENGTH).fill(null)

const iterator = (element, i) => {
    const initValue = i + 1
    const target = initValue ** 2
    const difference = target - initValue
    
    let currentValue = initValue

    console.log(`Iterate`)

    while (currentValue < target) currentValue += difference / ITERATION_COMPLEXITY

    return Math.floor(currentValue)
}

const button = document.querySelector(`.button`)
const ball = document.querySelector(`.ball`)

const startAnimation = () => {
    const start = performance.now()

    requestAnimationFrame(function continueAnimation() {
        const progress = performance.now() - start
        const ballRotateDegrees = Math.round(progress / SECOND_IN_MS * 360) % 360

        ball.style.transform = `rotate(${ballRotateDegrees}deg)`
        requestAnimationFrame(continueAnimation)
    })
}

button.addEventListener(`click`, (evt) => {
    evt.preventDefault()

    const results = chunk(elements, iterator)

    results.then((res) => console.log(`Chunk done. Result:`, res))
})

button.addEventListener(`contextmenu`, (evt) => {
    evt.preventDefault()

    const results = elements.map(iterator)

    console.log(`Sync done. Result:`, results)
})

startAnimation()
