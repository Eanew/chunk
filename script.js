const ITERATIONS_TO_DEFINE_MEDIAN_DELAY = 10
const SECTION_PROCESS_DELAY_BY_DEFAULT = 15

const SECOND_IN_MS = 1000
const BALL_ANIMATION_DURATION = 15 * SECOND_IN_MS
const SECTION_PROCESS_DELAY = SECOND_IN_MS / 40
const TEST_ARRAY_LENGTH = 1000000
const ITERATION_COMPLEXITY = 3000

const getSectionWithDelay = (elements, from, to, iterator) => new Promise(resolve => {
    setTimeout(() => {
        const section = []
        const start = performance.now()

        for (let i = from; i < Math.min(to, elements.length); i++) {
            section.push(iterator(elements[i], i, elements))
        }

        const delay = (performance.now() - start) || 1

        resolve([section, delay])
    }, 0)
})

const getResultsWithPermissibleSectionLength = async (elements, iterator, sectionProcessDelay) => {
    let i = 0
    let results = [iterator(elements[i], i, elements)]
    let sectionLength = ++i

    return (async function iterate() {
        const [section, delay] = await getSectionWithDelay(elements, i, i += sectionLength, iterator)
        
        results = results.concat(section)

        sectionLength = Math.min(
            Math.floor(sectionLength * sectionProcessDelay / delay) || 1,
            elements.length
        )
        
        return (delay > sectionProcessDelay / 2) || (sectionLength === elements.length)
            ? [results, sectionLength]
            : iterate()
    })()
}

const chunk = async (elements, iterator, sectionProcessDelay = SECTION_PROCESS_DELAY_BY_DEFAULT) => {
    const [initSection, sectionLength] = await getResultsWithPermissibleSectionLength(
        elements, iterator, sectionProcessDelay
    )
    
    console.log(`Section length:`, sectionLength)

    if (elements.length <= initSection.length) return initSection

    return new Promise(resolve => {
        const sections = []
        
        let i = initSection.length

        while (i < elements.length) {
            setTimeout(((from, to) => () => {
                const section = elements.slice(from, to).map((element, i) => iterator(element, from + i, elements))
    
                sections.push(section)
                
                if (to >= elements.length) resolve(initSection.concat(...sections))
            })(i, i += sectionLength), 0)
        }
    })
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

    const result = chunk(elements, iterator, SECTION_PROCESS_DELAY)

    result.then((res) => console.log(`chunk done`, res))
})

button.addEventListener(`contextmenu`, (evt) => {
    evt.preventDefault()
    startAnimation()

    const result = elements.map(iterator)

    console.log(`sync done`, result)
})
