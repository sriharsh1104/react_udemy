import ImageQuiz from './ImageQuiz'
import { VERB_QUESTIONS } from '../data/verbQuizData'

const VerbQuiz = () => (
  <ImageQuiz
    title="Verb Game"
    subtitle="Picture dekho, sahi verb choose karo (50 pictures)"
    questionText="Children, tell me what they are doing in the picture?"
    questions={VERB_QUESTIONS}
  />
)

export default VerbQuiz
