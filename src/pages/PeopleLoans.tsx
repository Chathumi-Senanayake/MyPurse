
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Loan } from "../types/loan";
import type { Person } from "../types/person";
import { Pencil, Trash2 } from "lucide-react";
import {
  calculateNetBalance,
  getTotalLent,
  getTotalBorrowed,
} from "../utils/calculations";
import {
  loadUserData,
  saveUserData,
  deleteUserData,
} from "../lib/firestore";

function PeopleLoans() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [personName, setPersonName] = useState("");
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editPersonName, setEditPersonName] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showLoanForm, setShowLoanForm] = useState(false);

  const [loanDirection, setLoanDirection] =
    useState<"lent" | "borrowed">("lent");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanDate, setLoanDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [loanNote, setLoanNote] = useState("");

  // Load this user's people and loans from Firestore
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setMessage("");

      try {
        const [peopleData, loansData] = await Promise.all([
          loadUserData("people"),
          loadUserData("loans"),
        ]);

        if (active) {
          setPeople(peopleData as Person[]);
          setLoans(loansData as Loan[]);
        }
      } catch (error) {
        console.error("Error loading people and loans:", error);

        if (active) {
          setMessage(
            "Could not load your data. Check your login, internet connection, and Firestore rules."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const personLoans = selectedPerson
    ? loans.filter((loan) => loan.personId === selectedPerson.id)
    : [];

  const netBalance = calculateNetBalance(personLoans);

  const lentLoans = personLoans.filter(
    (loan) => loan.direction === "lent"
  );

  const borrowedLoans = personLoans.filter(
    (loan) => loan.direction === "borrowed"
  );

  // Add a person
  async function handleAddPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = personName.trim();
    if (!name || saving) return;

    const newPerson: Person = {
      id: crypto.randomUUID(),
      name,
    };

    setSaving(true);
    setMessage("");

    try {
      await saveUserData(
        "people",
        newPerson.id,
        { ...newPerson }
      );

      setPeople((current) => [...current, newPerson]);
      setPersonName("");
      setMessage("Person added successfully!");
    } catch (error) {
      console.error("Error adding person:", error);
      setMessage("Could not save the person. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Start renaming a person
  function startRename(person: Person) {
    setEditingPersonId(person.id);
    setEditPersonName(person.name);
    setMessage("");
  }

  // Save a renamed person
  async function saveRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = editPersonName.trim();
    if (!name || !editingPersonId || saving) return;

    const updatedPerson: Person = {
      id: editingPersonId,
      name,
    };

    setSaving(true);
    setMessage("");

    try {
      await saveUserData("people", updatedPerson.id, {
        ...updatedPerson,
      });

      setPeople((current) =>
        current.map((person) =>
          person.id === updatedPerson.id ? updatedPerson : person
        )
      );

      if (selectedPerson?.id === updatedPerson.id) {
        setSelectedPerson(updatedPerson);
      }

      setEditingPersonId(null);
      setEditPersonName("");
      setMessage("Person updated successfully!");
    } catch (error) {
      console.error("Error renaming person:", error);
      setMessage("Could not update the person's name.");
    } finally {
      setSaving(false);
    }
  }

  // Delete a person and all associated loans
  async function deletePerson(person: Person) {
    if (saving) return;

    const associatedLoans = loans.filter(
      (loan) => loan.personId === person.id
    );

    const pendingLoans = associatedLoans.filter(
      (loan) => !loan.isCompleted
    );

    const pendingAmount = pendingLoans.reduce(
      (sum, loan) =>
        sum + (loan.direction === "lent" ? loan.amount : -loan.amount),
      0
    );

    const confirmation =
      `Delete ${person.name}?\n\n` +
      `This will permanently remove this person and all ${associatedLoans.length} ` +
      `associated loan record(s), including completed loans.\n\n` +
      `Pending loans: ${pendingLoans.length}\n` +
      `Net outstanding: Rs. ${pendingAmount.toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}\n\n` +
      "This action cannot be undone. Continue?";

    if (!window.confirm(confirmation)) return;

    setSaving(true);
    setMessage("");

    try {
      // Delete associated loans first, then the person.
      for (const loan of associatedLoans) {
        await deleteUserData("loans", loan.id);
      }

      await deleteUserData("people", person.id);

      setLoans((current) =>
        current.filter((loan) => loan.personId !== person.id)
      );

      setPeople((current) =>
        current.filter((item) => item.id !== person.id)
      );

      if (selectedPerson?.id === person.id) {
        setSelectedPerson(null);
        setShowLoanForm(false);
      }

      if (editingPersonId === person.id) {
        setEditingPersonId(null);
        setEditPersonName("");
      }

      setMessage("Person and associated loans deleted successfully.");
    } catch (error) {
      console.error("Error deleting person and loans:", error);
      setMessage(
        "Deletion was incomplete. Please refresh and check the records before trying again."
      );

      // Refresh from Firestore in case some deletes succeeded.
      try {
        const [peopleData, loansData] = await Promise.all([
          loadUserData("people"),
          loadUserData("loans"),
        ]);

        setPeople(peopleData as Person[]);
        setLoans(loansData as Loan[]);
      } catch (refreshError) {
        console.error("Could not refresh data:", refreshError);
      }
    } finally {
      setSaving(false);
    }
  }

  // Add a loan
  async function handleAddLoan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !selectedPerson ||
      !loanAmount.trim() ||
      !Number.isFinite(Number(loanAmount)) ||
      Number(loanAmount) <= 0 ||
      !loanDate ||
      saving
    ) {
      return;
    }

    const newLoan: Loan = {
      id: crypto.randomUUID(),
      personId: selectedPerson.id,
      direction: loanDirection,
      amount: Number(loanAmount),
      date: loanDate,
      note: loanNote.trim(),
      isCompleted: false,
    };

    setSaving(true);
    setMessage("");

    try {
      await saveUserData("loans", newLoan.id, {
        ...newLoan,
      });

      setLoans((current) => [...current, newLoan]);
      setLoanAmount("");
      setLoanNote("");
      setLoanDirection("lent");
      setLoanDate(new Date().toLocaleDateString("en-CA"));
      setShowLoanForm(false);
      setMessage("Loan saved successfully!");
    } catch (error) {
      console.error("Error saving loan:", error);
      setMessage("Could not save the loan. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Mark a loan as completed or pending
  async function toggleLoanCompleted(loanId: string) {
    if (saving) return;

    const loan = loans.find((item) => item.id === loanId);
    if (!loan) return;

    const updatedLoan: Loan = {
      ...loan,
      isCompleted: !loan.isCompleted,
    };

    setSaving(true);
    setMessage("");

    try {
      await saveUserData("loans", updatedLoan.id, {
        ...updatedLoan,
      });

      setLoans((current) =>
        current.map((item) =>
          item.id === loanId ? updatedLoan : item
        )
      );

      setMessage(
        updatedLoan.isCompleted
          ? "Loan marked as completed."
          : "Loan marked as pending."
      );
    } catch (error) {
      console.error("Error updating loan:", error);
      setMessage("Could not update the loan status.");
    } finally {
      setSaving(false);
    }
  }

  function renderLoanList(loanList: Loan[]) {
    if (loanList.length === 0) {
      return (
        <p className="rounded-xl bg-white p-4 text-sm text-[#718074]">
          No loans in this section yet.
        </p>
      );
    }

    return loanList.map((loan) => (
      <div
        key={loan.id}
        className="mb-3 rounded-xl border border-[#E4EAE1] bg-white p-4"
      >
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[#527D5B]"
            checked={loan.isCompleted}
            disabled={saving}
            onChange={() => toggleLoanCompleted(loan.id)}
          />

          <div className="min-w-0 flex-1">
            <p
              className={
                loan.isCompleted
                  ? "font-semibold text-gray-400 line-through"
                  : "font-semibold text-[#263D30]"
              }
            >
              Rs.{" "}
              {loan.amount.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <p className="mt-1 text-sm text-[#718074]">{loan.date}</p>

            {loan.note && (
              <p className="mt-1 break-words text-sm text-[#526457]">
                {loan.note}
              </p>
            )}

            {loan.isCompleted && (
              <p className="mt-2 text-xs font-medium text-green-700">
                Completed
              </p>
            )}
          </div>
        </label>
      </div>
    ));
  }

  return (
    <main className="min-h-screen rounded-[30px] bg-[#F5F7F2]/65 p-5 md:p-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[#263D30] md:text-4xl">
          People &amp; Loans
        </h1>

        <p className="mt-2 text-[#718074]">
          Manage money you lend and borrow.
        </p>
      </header>

      {message && (
        <p
          role="status"
          className={`mt-4 rounded-xl p-3 text-sm ${
            message.startsWith("Could not") ||
            message.startsWith("Deletion")
              ? "bg-red-50 text-red-700"
              : "bg-[#E4F1E5] text-[#386747]"
          }`}
        >
          {message}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center text-[#718074]">
          Loading your people and loans...
        </div>
      ) : (
        <>
          {/* Add person */}
          <form
            onSubmit={handleAddPerson}
            className="mt-7 flex flex-col gap-3 sm:flex-row"
          >
            <input
              className="min-w-0 flex-1 rounded-xl border border-[#DCE5DA] bg-white px-4 py-3 outline-none focus:border-[#71977A]"
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              placeholder="Enter person's name"
              aria-label="Person's name"
              required
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#263D30] px-5 py-3 font-semibold text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-[#385641] hover:shadow-lg disabled:opacity-60"
            >
              {saving ? "Saving..." : "+ Add Person"}
            </button>
          </form>

          {/* All people */}
          <section className="mt-9">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[#263D30]">
                All People
              </h2>

              <span className="rounded-full bg-[#E4F1E5] px-3 py-1 text-sm text-[#386747]">
                {people.length} {people.length === 1 ? "person" : "people"}
              </span>
            </div>

            {people.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#C9D7C7] bg-white/70 p-8 text-center">
                <p className="font-medium text-[#263D30]">
                  No people added yet
                </p>

                <p className="mt-2 text-sm text-[#718074]">
                  Add a person above to start tracking loans.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {people.map((person) => {
                  const associatedLoans = loans.filter(
                    (loan) => loan.personId === person.id
                  );

                  const pendingLoans = associatedLoans.filter(
                    (loan) => !loan.isCompleted
                  );

                  const lentTotal = getTotalLent(associatedLoans);
                  const borrowedTotal = getTotalBorrowed(associatedLoans);
                  const balance = calculateNetBalance(associatedLoans);
                  const isEditing = editingPersonId === person.id;

                  return (
                    <article
                      key={person.id}
                      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg ${
                        selectedPerson?.id === person.id
                          ? "border-[#71977A] ring-2 ring-[#D8F5E2]"
                          : "border-[#E4EAE1]"
                      }`}
                    >
                      {isEditing ? (
                        <form
                          onSubmit={saveRename}
                          className="space-y-3"
                        >
                          <label className="block text-sm font-medium text-[#526457]">
                            New name

                            <input
                              autoFocus
                              className="mt-2 w-full rounded-xl border border-[#DCE5DA] bg-white px-3 py-2 outline-none focus:border-[#71977A]"
                              value={editPersonName}
                              onChange={(event) =>
                                setEditPersonName(event.target.value)
                              }
                              required
                            />
                          </label>

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={saving}
                              className="rounded-lg bg-[#263D30] px-3 py-2 text-sm font-semibold text-white hover:bg-[#385641] disabled:opacity-60"
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingPersonId(null);
                                setEditPersonName("");
                              }}
                              className="rounded-lg border border-[#DCE5DA] px-3 py-2 text-sm text-[#526457]"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DDF3E2] font-bold text-[#386747]">
                              {person.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="truncate font-semibold text-[#263D30]">
                                  {person.name}
                                </h3>

                                <button
                                  type="button"
                                  onClick={() => startRename(person)}
                                  title={`Rename ${person.name}`}
                                  aria-label={`Rename ${person.name}`}
                                  className="shrink-0 rounded-lg p-1.5 text-[#718074] transition hover:scale-105 hover:bg-[#E4F1E5] hover:text-[#263D30]"
                                >
                                  <Pencil size={15} />
                                </button>

                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => deletePerson(person)}
                                  title={`Delete ${person.name}`}
                                  aria-label={`Delete ${person.name}`}
                                  className="shrink-0 rounded-lg p-1.5 text-red-500 transition hover:scale-105 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>

                              <p className="text-xs text-[#718074]">
                                {pendingLoans.length} pending{" "}
                                {pendingLoans.length === 1 ? "loan" : "loans"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 rounded-xl bg-[#F5F7F2] p-4">
                            <p className="text-xs text-[#718074]">
                              Net outstanding
                            </p>

                            <p
                              className={`mt-1 text-2xl font-bold ${
                                balance > 0
                                  ? "text-[#386747]"
                                  : balance < 0
                                    ? "text-[#B4534B]"
                                    : "text-[#263D30]"
                              }`}
                            >
                              Rs.{" "}
                              {balance.toLocaleString("en-LK", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>

                            <p className="mt-1 text-xs text-[#718074]">
                              {balance > 0
                                ? "They owe you"
                                : balance < 0
                                  ? "You owe them"
                                  : "No net outstanding"}
                            </p>
                          </div>

                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between gap-2 text-sm">
                              <span className="text-[#718074]">
                                Pending lent
                              </span>

                              <span className="font-medium text-[#386747]">
                                Rs.{" "}
                                {lentTotal.toLocaleString("en-LK", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>

                            <div className="flex justify-between gap-2 text-sm">
                              <span className="text-[#718074]">
                                Pending borrowed
                              </span>

                              <span className="font-medium text-[#526457]">
                                Rs.{" "}
                                {borrowedTotal.toLocaleString("en-LK", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPerson(person);
                              setShowLoanForm(false);
                            }}
                            className="mt-5 w-full rounded-xl bg-[#D8F5E2] px-4 py-3 font-semibold text-[#263D30] transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-[#C7EBD2] hover:shadow-lg"
                          >
                            View / Add Loan
                          </button>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Selected person's loan details */}
          {selectedPerson && (
            <section className="mt-10 border-t border-[#DCE5DA] pt-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm text-[#718074]">
                    Selected person
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-[#263D30]">
                    {selectedPerson.name}&apos;s Loans
                  </h2>

                  <p className="mt-2 text-[#718074]">
                    Net Balance:{" "}
                    <span className="font-bold text-[#263D30]">
                      Rs.{" "}
                      {netBalance.toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-[#718074]">
                    Positive = they owe you. Negative = you owe them.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLoanForm((current) => !current)}
                  className="rounded-xl bg-[#263D30] px-5 py-3 font-semibold text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-[#385641] hover:shadow-lg"
                >
                  {showLoanForm ? "Close Form" : "+ Add Loan"}
                </button>
              </div>

              {showLoanForm && (
                <form
                  onSubmit={handleAddLoan}
                  className="mt-6 grid max-w-2xl grid-cols-1 gap-4 rounded-2xl border border-[#E4EAE1] bg-white p-5 md:grid-cols-2"
                >
                  <label className="grid gap-2 text-sm font-medium text-[#526457]">
                    Loan Type

                    <select
                      className="rounded-xl border border-[#DCE5DA] bg-white p-3 text-[#263D30]"
                      value={loanDirection}
                      onChange={(event) =>
                        setLoanDirection(
                          event.target.value as "lent" | "borrowed"
                        )
                      }
                    >
                      <option value="lent">Lent — I gave money</option>
                      <option value="borrowed">
                        Borrowed — I received money
                      </option>
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-[#526457]">
                    Amount (Rs.)

                    <input
                      className="rounded-xl border border-[#DCE5DA] p-3 text-[#263D30]"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={loanAmount}
                      onChange={(event) => setLoanAmount(event.target.value)}
                      placeholder="Enter amount"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-[#526457]">
                    Date

                    <input
                      className="rounded-xl border border-[#DCE5DA] p-3 text-[#263D30]"
                      type="date"
                      required
                      value={loanDate}
                      onChange={(event) => setLoanDate(event.target.value)}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-[#526457]">
                    Note (optional)

                    <input
                      className="rounded-xl border border-[#DCE5DA] p-3 text-[#263D30]"
                      value={loanNote}
                      onChange={(event) => setLoanNote(event.target.value)}
                      placeholder="What was the loan for?"
                    />
                  </label>

                  <div className="flex flex-wrap gap-3 md:col-span-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-[#263D30] px-5 py-3 font-semibold text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Loan"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLoanForm(false)}
                      className="rounded-xl border border-[#DCE5DA] px-5 py-3 text-[#526457] transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section>
                  <h3 className="mb-4 text-lg font-semibold text-[#263D30]">
                    Lent
                  </h3>

                  {renderLoanList(lentLoans)}
                </section>

                <section>
                  <h3 className="mb-4 text-lg font-semibold text-[#263D30]">
                    Borrowed
                  </h3>

                  {renderLoanList(borrowedLoans)}
                </section>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPerson(null);
                  setShowLoanForm(false);
                }}
                className="mt-6 rounded-xl border border-[#DCE5DA] px-5 py-3 font-medium text-[#526457] hover:bg-white"
              >
                Close Details
              </button>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default PeopleLoans;
