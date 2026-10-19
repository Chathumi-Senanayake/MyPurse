export type Loan = {
    id: string;
    personId: string;
    direction: 'borrowed' | 'lent';
    amount: number;
    date: string;
    note?: string;
    isCompleted: boolean
}

