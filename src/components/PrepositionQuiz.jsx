import ImageQuiz from './ImageQuiz'
import { PREPOSITION_QUESTIONS } from '../data/prepositionQuizData'

const PrepositionQuiz = () => (
  <ImageQuiz
    title="Preposition Game"
    subtitle="Picture dekho, sahi preposition choose karo (50 pictures)"
    questionText="Children, tell me which preposition fits the picture?"
    questions={PREPOSITION_QUESTIONS}
  />
)

export default PrepositionQuiz
