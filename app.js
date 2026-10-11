
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// ==========================================
// 1. KONFIGURASI FIREBASE
// ==========================================
// Ganti dengan konfigurasi ASLI dari Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyBn-ERAS69N5yr2N-UKya5xmMPQVGSfQYA",
  authDomain: "izin-siswa-sman2.firebaseapp.com",
  projectId: "izin-siswa-sman2",
  storageBucket: "izin-siswa-sman2.firebasestorage.app",
  messagingSenderId: "228224655749",
  appId: "1:228224655749:web:d804a93eac455ffe49e4ec"
};

// ==========================================
// 2. INISIALISASI
// ==========================================
const $ = id => document.getElementById(id);

const loginButton = $("loginButton");
const loginPanel = $("loginPanel");
const loginForm = $("loginForm");
const cancelLogin = $("cancelLogin");
const loginMessage = $("loginMessage");

const dashboardPanel = $("dashboardPanel");
const dashboardTitle = $("dashboardTitle");
const dashboardDescription = $("dashboardDescription");
const dashboardWelcome = $("dashboardWelcome");
const roleBadge = $("roleBadge");

const adminDashboard = $("adminDashboard");
const waliDashboard = $("waliDashboard");
const wakasekDashboard = $("wakasekDashboard");
const kelasWaliInfo = $("kelasWaliInfo");

const statusMessage = $("statusMessage");
const filterTanggal = $("filterTanggal");
const dateDescription = $("dateDescription");

let auth;
let db;
let sedangMemproses = false;

function setStatus(pesan) {
  statusMessage.textContent = pesan;
}

function formatTanggalLokal(date) {
  const tahun = date.getFullYear();
  const bulan = String(date.getMonth() + 1).padStart(2, "0");
  const hari = String(date.getDate()).padStart(2, "0");

  return `${tahun}-${bulan}-${hari}`;
}

function tampilkanTanggal() {
  dateDescription.textContent = filterTanggal.value
    ? `Menampilkan izin untuk tanggal ${filterTanggal.value}.`
    : "Silakan pilih tanggal.";
}

function konfigurasiValid() {
  return Object.values(firebaseConfig).every(nilai =>
    typeof nilai === "string" &&
    nilai.length > 0 &&
    !nilai.startsWith("GANTI_DENGAN_")
  );
}

function tampilkanLogin(pesan = "") {
  loginPanel.hidden = false;
  loginMessage.textContent = pesan;
}

function sembunyikanLogin() {
  loginPanel.hidden = true;
  loginMessage.textContent = "";
  loginForm.reset();
}

function sembunyikanDashboard() {
  dashboardPanel.hidden = true;
  adminDashboard.hidden = true;
  waliDashboard.hidden = true;
  wakasekDashboard.hidden = true;
  kelasWaliInfo.textContent = "";
}

function tampilkanDashboard(profile) {
  const role = profile.role;

  sembunyikanLogin();

  adminDashboard.hidden = role !== "admin";
  waliDashboard.hidden = role !== "wali";
  wakasekDashboard.hidden = role !== "wakasek";

  dashboardPanel.hidden = false;
  dashboardWelcome.textContent =
    `Selamat datang, ${profile.nama || "Pengguna"}.`;

  if (role === "admin") {
    dashboardTitle.textContent = "Dashboard Admin";
    dashboardDescription.textContent =
      "Pengelolaan data sekolah";
    roleBadge.textContent = "ADMIN";
  } else if (role === "wali") {
    dashboardTitle.textContent = "Dashboard Wali Kelas";
    dashboardDescription.textContent =
      "Pengajuan izin siswa";
    roleBadge.textContent = "WALI KELAS";
    kelasWaliInfo.textContent =
      `Kelas tanggung jawab: ${profile.kelasWali || "Belum ditetapkan"}`;
  } else if (role === "wakasek") {
    dashboardTitle.textContent = "Dashboard Wakasek";
    dashboardDescription.textContent =
      "Pemeriksaan dan persetujuan izin";
    roleBadge.textContent = "WAKASEK";
  }

  loginButton.textContent = "Logout";
}

async function periksaProfil(user) {
  try {
    const profilRef = doc(db, "users", user.uid);
    const profilSnap = await getDoc(profilRef);

    if (!profilSnap.exists()) {
      setStatus(
        "Akun berhasil login, tetapi profil pengguna belum dibuat. " +
        "Hubungi administrator."
      );
      await signOut(auth);
      return;
    }

    const profile = profilSnap.data();
    const roleValid = ["admin", "wali", "wakasek"].includes(
      profile.role
    );

    if (profile.aktif !== true || !roleValid) {
      setStatus(
        "Akun tidak aktif atau peran belum ditetapkan. " +
        "Hubungi administrator."
      );
      await signOut(auth);
      return;
    }

    tampilkanDashboard(profile);
    setStatus("Login berhasil.");
  } catch (error) {
    console.error("Gagal membaca profil:", error);

    setStatus(
      "Profil tidak dapat dibaca. Periksa Firestore Rules, " +
      "UID dokumen users, dan koneksi internet."
    );

    await signOut(auth);
  }
}

// ==========================================
// 3. LOGIN DAN LOGOUT
// ==========================================
loginButton.addEventListener("click", async () => {
  if (!auth) {
    setStatus("Firebase belum dikonfigurasi.");
    return;
  }

  if (auth.currentUser) {
    try {
      await signOut(auth);
      sembunyikanDashboard();
      tampilkanLogin();
      setStatus("Anda telah logout.");
    } catch (error) {
      console.error(error);
      setStatus("Logout gagal. Silakan coba kembali.");
    }
    return;
  }

  loginPanel.hidden = !loginPanel.hidden;

  if (!loginPanel.hidden) {
    $("email").focus();
  }
});

cancelLogin.addEventListener("click", () => {
  sembunyikanLogin();
});

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (sedangMemproses) return;

  if (!auth) {
    loginMessage.textContent =
      "Firebase belum dikonfigurasi dengan benar.";
    return;
  }

  const email = $("email").value.trim();
  const password = $("password").value;

  sedangMemproses = true;
  const tombolSubmit = loginForm.querySelector(
    'button[type="submit"]'
  );

  tombolSubmit.disabled = true;
  tombolSubmit.textContent = "Memeriksa akun...";
  loginMessage.textContent = "";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged akan memeriksa profil dan peran.
  } catch (error) {
    console.error("Login gagal:", error);

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      loginMessage.textContent =
        "Email atau kata sandi tidak benar.";
    } else if (error.code === "auth/invalid-email") {
      loginMessage.textContent =
        "Format email tidak valid.";
    } else if (error.code === "auth/too-many-requests") {
      loginMessage.textContent =
        "Terlalu banyak percobaan. Coba lagi nanti.";
    } else {
      loginMessage.textContent =
        "Login gagal. Periksa konfigurasi Firebase dan domain.";
    }
  } finally {
    sedangMemproses = false;
    tombolSubmit.disabled = false;
    tombolSubmit.textContent = "Masuk";
  }
});

// ==========================================
// 4. INISIALISASI APLIKASI
// ==========================================
filterTanggal.value = formatTanggalLokal(new Date());
filterTanggal.addEventListener("change", tampilkanTanggal);
tampilkanTanggal();
sembunyikanDashboard();

if (!konfigurasiValid()) {
  loginButton.disabled = true;
  setStatus(
    "Konfigurasi Firebase belum diisi. Edit firebaseConfig di app.js."
  );
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    onAuthStateChanged(auth, async user => {
      if (user) {
        await periksaProfil(user);
      } else {
        sembunyikanDashboard();
        loginButton.textContent = "Login";
      }
    });

    setStatus(
      "Aplikasi siap. Login untuk membuka dashboard pengguna."
    );
  } catch (error) {
    console.error("Inisialisasi gagal:", error);
    setStatus(
      "Aplikasi gagal terhubung ke Firebase. Periksa konfigurasi."
    );
  }
}

// ==========================================
// 5. SERVICE WORKER
// ==========================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (error) {
      console.error("Service worker gagal:", error);
    }
  });
}
