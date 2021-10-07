const ITERATIONS_TO_DEFINE_MEDIAN_DELAY = 10
const SECTION_PROCESS_DELAY_BY_DEFAULT = 15

const SECOND_IN_MS = 1000
const BALL_ANIMATION_DURATION = 7 * SECOND_IN_MS
const PERMISSIBLE_TIME_TO_RERENDER = SECOND_IN_MS / 40
const TEST_ARRAY_LENGTH = 100
const ITERATION_COMPLEXITY = 30000000

const median = values => {
    const sortedValues = values.slice().sort((a, b) => a - b)
    const middleIndex = Math.floor(values.length / 2)

    return values.length % 2
        ? sortedValues[middleIndex]
        : (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
}
const getIterationsByDelay = (iterationDelay, expectedDelay) => Math.ceil(expectedDelay / iterationDelay)

const resultWithDelay = func => {
    const start = performance.now()
    const result = func()
    const delay = (performance.now() - start) || 1

    return [result, delay]
}

const resultsWithMedianDelay = async (elements, iterator) => {
    const results = []
    const delays = []

    const cortages = await Promise.all(
        elements.map((element, i) => new Promise((resolve) => setTimeout(() => {
            const [result, delay] = resultWithDelay(() => iterator(element, i, elements))

            resolve([result, delay])
        }, 0)))
    )
    
    cortages.forEach(([result, delay]) => {
        results.push(result)
        delays.push(delay)
    })

    return [results, median(delays)]
}

const chunk = async (elements, iterator, sectionProcessDelay = SECTION_PROCESS_DELAY_BY_DEFAULT) => {
    if (elements.length <= ITERATIONS_TO_DEFINE_MEDIAN_DELAY) return (elements.map(iterator))

    let i = ITERATIONS_TO_DEFINE_MEDIAN_DELAY

    const [initSection, medianDelay] = await resultsWithMedianDelay(elements.slice(0, i), iterator)
    
    const sectionLength = getIterationsByDelay(medianDelay, sectionProcessDelay)
    const sections = []

    const result = await new Promise(resolve => {
        while (i < elements.length) {
            setTimeout(((from, to) => () => {
                const section = elements.slice(from, to).map((element, i) => iterator(element, from + i, elements))
    
                sections.push(section)
                
                if (to >= elements.length) resolve(initSection.concat(...sections))
            })(i, i += sectionLength), 0)
        }
    })
    
    return result
}

const button = document.querySelector(`.button`)
const ball = document.querySelector(`.ball`)

const elements = new Array(TEST_ARRAY_LENGTH).fill(null)

const iterator = (element, i) => {
    const initValue = i + 1
    const target = initValue * initValue
    const difference = target - initValue
    let currentValue = initValue

    while (currentValue < target) {
        currentValue += difference / ITERATION_COMPLEXITY
    }

    return Math.floor(currentValue)
}

const startAnimation = () => {
    const duration = BALL_ANIMATION_DURATION
    const start = performance.now()

    const animation = progress => {
        const ballRotationSpeed = duration / SECOND_IN_MS
        const ballRotateDegrees = Math.round(progress / duration * ballRotationSpeed * 360)

        ball.style.transform = `rotate(${ballRotateDegrees}deg)`
    }

    requestAnimationFrame(function continueAnimation() {
        const progress = performance.now() - start

        animation(progress)

        if (progress < duration) requestAnimationFrame(continueAnimation)
    })
}

button.addEventListener(`click`, (evt) => {
    evt.preventDefault()
    startAnimation()

    const result = chunk(elements, iterator, PERMISSIBLE_TIME_TO_RERENDER)

    result.then((res) => console.log(`chunk done`, res[res.length - 1]))
})

button.addEventListener(`contextmenu`, (evt) => {
    evt.preventDefault()
    startAnimation()

    const result = elements.map(iterator)

    console.log(`sync done`, result[result.length - 1])
})
