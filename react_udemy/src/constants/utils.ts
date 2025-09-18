export function combine(a: number, b: number, c: number): number {
    return (a * b) / c;
}
export const combineArrow = (a: number, b: number, c: number): number => {
    return (a * b) / c;
}

export function transformToObjects(numbers: number[]): { val: number }[] {
    return numbers.map((number) => ({ val: number }));
}
