
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { auth } from "./firebase";

export const db = getFirestore();

function getUserId(): string {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in before accessing your data.");
  }

  return user.uid;
}

export async function saveUserData(
  collectionName: string,
  documentId: string,
  data: Record<string, unknown>
) {
  const uid = getUserId();

  await setDoc(
    doc(db, "users", uid, collectionName, documentId),
    data
  );
}

export async function loadUserData(collectionName: string) {
  const uid = getUserId();

  const snapshot = await getDocs(
    collection(db, "users", uid, collectionName)
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function deleteUserData(
  collectionName: string,
  documentId: string
) {
  const uid = getUserId();

  await deleteDoc(
    doc(db, "users", uid, collectionName, documentId)
  );
}
