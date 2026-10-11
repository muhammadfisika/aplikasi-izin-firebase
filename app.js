
import { initializeApp }
  from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// GANTI seluruh nilai contoh dengan konfigurasi
// asli yang diperoleh dari Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyBn-ERAS69N5yr2N-UKya5xmMPQVGSfQYA",
  authDomain: "izin-siswa-sman2.firebaseapp.com",
  projectId: "izin-siswa-sman2",
  storageBucket: "izin-siswa-sman2.firebasestorage.app",
  messagingSenderId: "228224655749",
  appId: "1:228224655749:web:d804a93eac455ffe49e4ec"
};

const statusMessage = document.getElementById("statusMessage");
const filterTanggal = document.getElementById("filterTanggal");
const dateDescription = document.getElementById("dateDescription");
const loginButton = document.getElementById("loginButton");
const loginPanel = document.getElementById("loginPanel");
const loginForm = document.getElementById("loginForm");
const cancelLogin = document.getElementById("cancelLogin");
const loginMessage = document.getElementById("loginMessage");

let app;
let auth;
let db;

function formatTanggalLokal(date) {
  const tahun = date.getFullYear();
  const bulan = String(date.getMonth() + 1).padStart(2, "0");
  const hari = String(date.getDate()).padStart(2, "0");

  return `${tahun}-${bulan}-${hari}`;
}

function tampilkanTanggal() {
  const tanggal = filterTanggal.value;

  if (!tanggal) {
    dateDescription.textContent = "Silakan pilih tanggal.";
    return;
  }

  dateDescription.textContent =
    `Menampilkan izin untuk tanggal ${tanggal}.`;
}

function tampilkanStatus(pesan) {
  statusMessage.textContent = pesan;
}

function inisialisasiFirebase() {
  const belumDiisi = Object.values(firebaseConfig).some(
    nilai =>
      !nilai ||
      nilai.startsWith("GANTI_DENGAN_")
  );

  if (belumDiisi) {
    tampilkanStatus(
      "Firebase belum dikonfigurasi. Ganti nilai firebaseConfig " +
      "dengan konfigurasi dari Firebase Console."
    );
    return;
  }

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Disiapkan untuk Tahap 4 dan tahap berikutnya.
    console.info("Firebase berhasil diinisialisasi.");
    tampilkanStatus(
      "Firebase terhubung. Data izin akan diaktifkan " +
      "setelah fitur aplikasi selesai dikonfigurasi."
    );
  } catch (error) {
    console.error("Kesalahan inisialisasi Firebase:", error);
    tampilkanStatus(
      "Firebase belum dapat diinisialisasi. Periksa konfigurasi."
    );
  }
}

loginButton.addEventListener("click", () => {
  loginPanel.hidden = !loginPanel.hidden;

  if (!loginPanel.hidden) {
    document.getElementById("email").focus();
  }
});

cancelLogin.addEventListener("click", () => {
  loginPanel.hidden = true;
  loginMessage.textContent = "";
  loginForm.reset();
});

// Autentikasi sebenarnya akan dibuat pada Tahap 4.
loginForm.addEventListener("submit", event => {
  event.preventDefault();

  loginMessage.textContent =
    "Fitur autentikasi sedang disiapkan pada Tahap 4.";
});

filterTanggal.value = formatTanggalLokal(new Date());
filterTanggal.addEventListener("change", tampilkanTanggal);

tampilkanTanggal();
inisialisasiFirebase();

// Mendaftarkan service worker jika didukung browser.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
      console.info("Service worker berhasil didaftarkan.");
    } catch (error) {
      console.error("Service worker gagal didaftarkan:", error);
    }
  });
}
