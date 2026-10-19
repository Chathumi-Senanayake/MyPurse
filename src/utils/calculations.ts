import type { Loan } from "../types/loan";

function getPendingLoans(loans: Loan[]) {
    const pendingLoans = loans.filter(
    (loan) => !loan.isCompleted
    );
    return pendingLoans;
}

function getLentLoans(loans: Loan[]) {
    const pendingLoans = getPendingLoans(loans);

    const lentLoans = pendingLoans.filter(
    (loan) => loan.direction === 'lent'
    );
    return lentLoans;
}

function getBorrowedLoans(loans: Loan[]) {
    const pendingLoans = getPendingLoans(loans);

    const borrowedLoans = pendingLoans.filter(
    (loan) => loan.direction === 'borrowed'
    );
    return borrowedLoans;
}

export function getTotalLent(loans: Loan[]): number {
  return getLentLoans(loans).reduce(
    (sum, loan) => sum + loan.amount,
    0
  );
}

export function getTotalBorrowed(loans: Loan[]): number {
  return getBorrowedLoans(loans).reduce(
    (sum, loan) => sum + loan.amount,
    0
  );
}

export function calculateNetBalance(loans: Loan[]): number {
  return getTotalLent(loans) - getTotalBorrowed(loans);
}