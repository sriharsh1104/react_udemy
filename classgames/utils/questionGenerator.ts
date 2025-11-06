// Question Generator for Maths Games
export interface MathQuestion {
  question: string;
  options: number[];
  correct: number;
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division';
}

// Generate random number between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate wrong options that are different from correct answer
function generateWrongOptions(correct: number, count: number = 3): number[] {
  const wrongOptions: number[] = [];
  const used = new Set([correct]);

  while (wrongOptions.length < count) {
    // Generate options that are close to correct answer but different
    const offset = randomInt(-5, 5);
    const option = correct + offset;
    
    if (!used.has(option) && option > 0 && option !== correct) {
      wrongOptions.push(option);
      used.add(option);
    }
  }

  return wrongOptions;
}

// Generate addition question
function generateAddition(): MathQuestion {
  const num1 = randomInt(1, 20);
  const num2 = randomInt(1, 20);
  const correct = num1 + num2;
  const wrongOptions = generateWrongOptions(correct);
  const options = [correct, ...wrongOptions].sort(() => Math.random() - 0.5);

  return {
    question: `What is ${num1} + ${num2}?`,
    options,
    correct,
    operation: 'addition',
  };
}

// Generate subtraction question
function generateSubtraction(): MathQuestion {
  const num1 = randomInt(10, 30);
  const num2 = randomInt(1, num1);
  const correct = num1 - num2;
  const wrongOptions = generateWrongOptions(correct);
  const options = [correct, ...wrongOptions].sort(() => Math.random() - 0.5);

  return {
    question: `What is ${num1} - ${num2}?`,
    options,
    correct,
    operation: 'subtraction',
  };
}

// Generate multiplication question
function generateMultiplication(): MathQuestion {
  const num1 = randomInt(2, 10);
  const num2 = randomInt(2, 10);
  const correct = num1 * num2;
  const wrongOptions = generateWrongOptions(correct);
  const options = [correct, ...wrongOptions].sort(() => Math.random() - 0.5);

  return {
    question: `What is ${num1} × ${num2}?`,
    options,
    correct,
    operation: 'multiplication',
  };
}

// Generate division question
function generateDivision(): MathQuestion {
  const divisor = randomInt(2, 10);
  const quotient = randomInt(2, 10);
  const dividend = divisor * quotient;
  const correct = quotient;
  const wrongOptions = generateWrongOptions(correct);
  const options = [correct, ...wrongOptions].sort(() => Math.random() - 0.5);

  return {
    question: `What is ${dividend} ÷ ${divisor}?`,
    options,
    correct,
    operation: 'division',
  };
}

// Generate all questions: 5 each of addition, subtraction, multiplication, division
export function generateMathQuestions(): MathQuestion[] {
  const questions: MathQuestion[] = [];

  // Generate 5 questions for each operation
  for (let i = 0; i < 5; i++) {
    questions.push(generateAddition());
  }
  for (let i = 0; i < 5; i++) {
    questions.push(generateSubtraction());
  }
  for (let i = 0; i < 5; i++) {
    questions.push(generateMultiplication());
  }
  for (let i = 0; i < 5; i++) {
    questions.push(generateDivision());
  }

  // Shuffle the questions randomly
  return questions.sort(() => Math.random() - 0.5);
}

