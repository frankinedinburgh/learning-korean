import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Flashcard from '../Flashcard'


describe('Flashcard component', () => {
    let mockProps = {
        card: {
            category: 'Animals',
            korean: '호랑이',
            english: 'Tiger',
            romanization: 'horangi'
        },
        onRate: jest.fn(),
        isFlipped: false,
        onFlip: jest.fn()
    }


    it('Should render with given props', () => {
        render(<Flashcard {...mockProps}/>)
        expect(screen.getByText('Tiger')).toBeInTheDocument();
    })

    it('Should display korean when flipped', () => {
        render(<Flashcard {...mockProps} isFlipped={true}/>)
        expect(screen.getByText('호랑이')).toBeInTheDocument();
    })

    it('Should call onRate when clicking a rating button', async () => {
        jest.useFakeTimers()
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
        render(<Flashcard {...mockProps} isFlipped={true}/>)

        const element = screen.getByRole('button', {name: 'Easy'})
        await user.click(element)

        jest.runAllTimers()

        expect(mockProps.onRate).toHaveBeenCalledWith(4)
    })

})

// // find elements
// screen.getByText('some text')        // throws if not found
// screen.getByRole('button', { name: 'Click me' })

// // simulate user actions
// await userEvent.click(element)

// // mock functions
// const onRate = jest.fn()
// expect(onRate).toHaveBeenCalledWith(3)

// // fake timers (for the setTimeout in handleRate)
// jest.useFakeTimers()
// jest.runAllTimers()
