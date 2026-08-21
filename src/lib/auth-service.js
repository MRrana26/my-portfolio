import { auth, db } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";


export const registerUser = async (formData) => {
  const { email, password, ...additionalData } = formData;

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userRef = doc(db, "MASUDUR_RAHMAN_DATABASE", user.uid);
  
  const userData = {
    uid: user.uid,
    email: user.email,
    name: additionalData.name || "",
    mobile: additionalData.mobile || "",
    dob: additionalData.dob || "",
    nid: additionalData.nid || "",
    address: additionalData.address || "",
    fatherName: additionalData.fatherName || "",
    companyName: additionalData.companyName || "",
    profession: additionalData.profession || "",
    
    // Default system values
    role: "user",
    status: "pending",
    plan: "free",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, userData);
  return { user, userData };
};

// ২. ইউজার লগইন
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // ফায়ারস্টোর থেকে ইউজারের রোল ও স্ট্যাটাস চেক করা
  const userRef = doc(db, "MASUDUR_RAHMAN_DATABASE", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("ইউজারের কোনো প্রোফাইল ডাটাবেসে পাওয়া যায়নি!");
  }

  return { user, profile: userSnap.data() };
};

// ৩. লগআউট
export const logoutUser = async () => {
  await signOut(auth);
};