
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  orderBy
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// PERTAHANKAN firebaseConfig ASLI DARI PROYEK ANDA.
const firebaseConfig = {
  apiKey: "AIzaSyBn-ERAS69N5yr2N-UKya5xmMPQVGSfQYA",
  authDomain: "izin-siswa-sman2.firebaseapp.com",
  projectId: "izin-siswa-sman2",
  storageBucket: "izin-siswa-sman2.firebasestorage.app",
  messagingSenderId: "228224655749",
  appId: "1:228224655749:web:d804a93eac455ffe49e4ec"
};

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


// Fitur admin Tahap 5
const studentIdInput = $("studentId");
const studentNamaInput = $("studentNama");
const studentNisnInput = $("studentNisn");
const studentKelasInput = $("studentKelas");
const saveStudentButton = $("saveStudentButton");
const resetStudentButton = $("resetStudentButton");
const studentCsvFile = $("studentCsvFile");
const importStudentButton = $("importStudentButton");
const downloadCsvTemplateButton = $("downloadCsvTemplateButton");
const studentMessage = $("studentMessage");
const studentSearch = $("studentSearch");
const studentCount = $("studentCount");
const studentTableBody = $("studentTableBody");

//elemen tambahan tahap6 ------
const izinForm = $("izinForm");
const izinSiswa = $("izinSiswa");
const izinTanggal = $("izinTanggal");
const izinAlasan = $("izinAlasan");
const izinWaktuKeluar = $("izinWaktuKeluar");
const izinWaktuKembali = $("izinWaktuKembali");
const submitIzinButton = $("submitIzinButton");
const resetIzinButton = $("resetIzinButton");
const izinMessage = $("izinMessage");
const riwayatIzinWali = $("riwayatIzinWali");
//---------------
//elemen tambahan tahap8 ------
const monitoringDashboard =
  document.getElementById("monitoringIzinDashboard");

const riwayatDashboard =
  document.getElementById("riwayatKeputusanDashboard");
//---------------

let auth;
let db;
let profilAktif = null;
let daftarSiswa = [];
let sedangMemprosesLogin = false;
let sedangMemprosesSiswa = false;

function setStatus(pesan) {
  statusMessage.textContent = pesan;
}

function setPesanSiswa(pesan) {
  studentMessage.textContent = pesan;
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
  return Object.values(firebaseConfig).every(
    nilai =>
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
  //kelasWaliInfo.textContent = "";
  profilAktif = null;
  daftarSiswa = [];
  studentTableBody.replaceChildren();
  studentCount.textContent = "";
  setPesanSiswa("");
}

function tampilkanDashboard(profile) {
  profilAktif = profile;

  adminDashboard.hidden = profile.role !== "admin";
  waliDashboard.hidden = profile.role !== "wali";
  wakasekDashboard.hidden = profile.role !== "wakasek";
  dashboardPanel.hidden = false;

  dashboardWelcome.textContent =
    `Selamat datang, ${profile.nama || "Pengguna"}.`;

  if (profile.role === "admin") {
    dashboardTitle.textContent = "Dashboard Admin";
    dashboardDescription.textContent = "Pengelolaan data sekolah";
    roleBadge.textContent = "ADMIN";
    muatDaftarSiswa();
  } 
  
  else if (profile.role === "wali") {
  dashboardTitle.textContent = "Dashboard Wali Kelas";
  dashboardDescription.textContent = "Pengajuan izin siswa";
  roleBadge.textContent = "WALI KELAS";
  kelasWaliInfo.textContent =
    `Kelas tanggung jawab: ${profile.kelasWali || "Belum ditetapkan"}`;

  muatPilihanSiswaWali();
}
  
  else if (profile.role === "wakasek") {
    dashboardTitle.textContent = "Dashboard Wakasek";
    dashboardDescription.textContent = "Pemeriksaan dan persetujuan izin";
    roleBadge.textContent = "WAKASEK";

    wakasekDashboard.hidden = false;
    muatIzinWakasek();
    if (monitoringDashboard){
      monitoringDashboard.hidden = true;
    }
    if (riwayatDashboard){
      riwayatDashboard.hidden = true;
    }
    
    
    
  }

  loginButton.textContent = "Logout";
}

async function periksaProfil(user) {
  try {
    const profilRef = doc(db, "users", user.uid);
    const profilSnap = await getDoc(profilRef);

    if (!profilSnap.exists()) {
      setStatus(
        "Profil pengguna belum dibuat. Minta admin membuat dokumen users dengan ID UID akun ini."
      );
      await signOut(auth);
      return;
    }

    const profile = profilSnap.data();
    const roleValid = ["admin", "wali", "wakasek"].includes(profile.role);

    if (profile.aktif !== true || !roleValid) {
      setStatus("Akun tidak aktif atau peran belum ditetapkan.");
      await signOut(auth);
      return;
    }

    tampilkanDashboard(profile);
    setStatus("Login berhasil.");
    sembunyikanLogin();
  } catch (error) {
    console.error("Gagal membaca profil:", error);
    setStatus(
      "Profil tidak dapat dibaca. Periksa Firestore Rules dan dokumen users."
    );
    await signOut(auth);
  }
}


// =====================================================
// TAHAP 8 - PEMANTAUAN IZIN DAN RIWAYAT KEPUTUSAN
// =====================================================

const filterTanggalIzin = document.getElementById("filterTanggalIzin");
const filterKelasIzin = document.getElementById("filterKelasIzin");
const btnFilterIzin = document.getElementById("btnFilterIzin");
const btnResetFilterIzin = document.getElementById("btnResetFilterIzin");

const monitoringIzinMessage =
  document.getElementById("monitoringIzinMessage");

const tabelMonitoringIzin =
  document.getElementById("tabelMonitoringIzin");

const riwayatKeputusanMessage =
  document.getElementById("riwayatKeputusanMessage");

const tabelRiwayatKeputusan =
  document.getElementById("tabelRiwayatKeputusan");

function teksAmanTahap8(nilai) {
  return String(nilai ?? "").replace(/[&<>"']/g, karakter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[karakter]);
}

function statusIzinTahap8(izin) {
  if (izin.statusWakasek === "disetujui") {
    return "Disetujui";
  }

  if (izin.statusWakasek === "ditolak") {
    return "Ditolak";
  }

  return "Menunggu";
}

// Mengambil data izin sesuai filter.
async function ambilDataIzinTahap8() {
  const hasil = await getDocs(collection(db, "izin"));
  const data = [];

  hasil.forEach(dokumen => {
    data.push({
      id: dokumen.id,
      ...dokumen.data()
    });
  });

  const tanggal = filterTanggalIzin?.value || "";
  const kelas = filterKelasIzin?.value || "";

  return data
    .filter(izin => {
      // Hanya pengajuan yang sudah diputuskan Wakasek.
      const sudahDiputuskan = [
        "disetujui",
        "ditolak"
      ].includes(izin.statusWakasek);

      const cocokTanggal =
        !tanggal || izin.tanggal === tanggal;

      const cocokKelas =
        !kelas ||
        String(izin.kelas || "").startsWith(kelas);

      return sudahDiputuskan && cocokTanggal && cocokKelas;
    })
    .sort((a, b) =>
      String(b.tanggal || "").localeCompare(String(a.tanggal || ""))
    );
}

// Tabel pemantauan: hanya izin yang disetujui.
async function muatMonitoringIzin() {
  if (!profilAktif ||
      !["admin", "wakasek"].includes(profilAktif.role)) {
    if (monitoringIzinMessage) {
      monitoringIzinMessage.textContent =
        "Halaman ini hanya dapat diakses Admin atau Wakasek.";
    }
    return;
  }

  tabelMonitoringIzin.innerHTML =
    '<tr><td colspan="10">Memuat data...</td></tr>';

  monitoringIzinMessage.textContent = "";

  try {
    const data = await ambilDataIzinTahap8();
    const disetujui = data.filter(
      izin => izin.statusWakasek === "disetujui"
    );

    if (disetujui.length === 0) {
      tabelMonitoringIzin.innerHTML =
        '<tr><td colspan="10">Tidak ada izin yang sesuai dengan filter.</td></tr>';
      return;
    }

    tabelMonitoringIzin.innerHTML = disetujui.map((izin, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${teksAmanTahap8(izin.tanggal)}</td>
        <td>${teksAmanTahap8(izin.namaSiswa)}</td>
        <td>${teksAmanTahap8(izin.nisn)}</td>
        <td>${teksAmanTahap8(izin.kelas)}</td>
        <td>${teksAmanTahap8(izin.alasan)}</td>
        <td>${teksAmanTahap8(izin.waktuKeluar)}</td>
        <td>${teksAmanTahap8(izin.waktuKembali)}</td>
        <td>${teksAmanTahap8(izin.waliNama)}</td>
        <td>${statusIzinTahap8(izin)}</td>
      </tr>
    `).join("");

  } catch (error) {
    console.error("Gagal memuat monitoring izin:", error);

    tabelMonitoringIzin.innerHTML =
      '<tr><td colspan="10">Data gagal dimuat.</td></tr>';

    monitoringIzinMessage.textContent =
      "Gagal membaca data. Periksa Firestore Rules dan koneksi.";
  }
}

// Riwayat keputusan Wakasek: disetujui dan ditolak.
async function muatRiwayatKeputusan() {
  if (!profilAktif ||
      !["admin", "wakasek"].includes(profilAktif.role)) {
    riwayatKeputusanMessage.textContent =
      "Halaman ini hanya dapat diakses Admin atau Wakasek.";
    return;
  }

  tabelRiwayatKeputusan.innerHTML =
    '<tr><td colspan="9">Memuat riwayat...</td></tr>';

  riwayatKeputusanMessage.textContent = "";

  try {
    const data = await ambilDataIzinTahap8();

    if (data.length === 0) {
      tabelRiwayatKeputusan.innerHTML =
        '<tr><td colspan="9">Belum ada riwayat keputusan.</td></tr>';
      return;
    }

    tabelRiwayatKeputusan.innerHTML = data.map((izin, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${teksAmanTahap8(izin.tanggal)}</td>
        <td>${teksAmanTahap8(izin.namaSiswa)}</td>
        <td>${teksAmanTahap8(izin.kelas)}</td>
        <td>${teksAmanTahap8(izin.alasan)}</td>
        <td>${teksAmanTahap8(izin.waliNama)}</td>
        <td>${statusIzinTahap8(izin)}</td>
        <td>${teksAmanTahap8(izin.waktuKeluar)}</td>
        <td>${teksAmanTahap8(izin.waktuKembali)}</td>
      </tr>
    `).join("");

  } catch (error) {
    console.error("Gagal memuat riwayat keputusan:", error);

    tabelRiwayatKeputusan.innerHTML =
      '<tr><td colspan="9">Riwayat gagal dimuat.</td></tr>';

    riwayatKeputusanMessage.textContent =
      "Gagal membaca riwayat. Periksa Firestore Rules dan koneksi.";
  }
}

// Terapkan filter.
if (btnFilterIzin) {
  btnFilterIzin.addEventListener("click", async () => {
    await muatMonitoringIzin();
    await muatRiwayatKeputusan();
  });
}

// Reset filter.
if (btnResetFilterIzin) {
  btnResetFilterIzin.addEventListener("click", async () => {
    filterTanggalIzin.value = "";
    filterKelasIzin.value = "";

    await muatMonitoringIzin();
    await muatRiwayatKeputusan();
  });
}

// =====================================================
// TAHAP 7 - DASHBOARD WAKASEK
// =====================================================

const wakasekMessage = document.getElementById("wakasekMessage");
const tabelIzinWakasek = document.getElementById("tabelIzinWakasek");
const refreshIzinWakasek = document.getElementById("refreshIzinWakasek");

function pesanWakasek(pesan) {
  if (wakasekMessage) {
    wakasekMessage.textContent = pesan;
  }
}

function amanWakasek(nilai) {
  return String(nilai ?? "").replace(/[&<>"']/g, karakter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[karakter]);
}

async function muatIzinWakasek() {
  if (!profilAktif || profilAktif.role !== "wakasek") {
    pesanWakasek("Akses hanya untuk pengguna Wakasek.");
    return;
  }

  tabelIzinWakasek.innerHTML =
    '<tr><td colspan="10">Memuat data pengajuan...</td></tr>';

  pesanWakasek("");

  try {
    const izinRef = collection(db, "izin");

    // Ambil pengajuan yang belum diputuskan Wakasek.
    const q = query(
      izinRef,
      where("statusWakasek", "==", "menunggu")
    );

    const hasil = await getDocs(q);

    const daftar = [];

    hasil.forEach(dokumen => {
      daftar.push({
        id: dokumen.id,
        ...dokumen.data()
      });
    });

    daftar.sort((a, b) => {
      return String(b.tanggal || "").localeCompare(
        String(a.tanggal || "")
      );
    });

    if (daftar.length === 0) {
      tabelIzinWakasek.innerHTML =
        '<tr><td colspan="10">Tidak ada pengajuan yang menunggu persetujuan.</td></tr>';
      return;
    }

    tabelIzinWakasek.innerHTML = daftar.map((izin, indeks) => `
      <tr>
        <td>${indeks + 1}</td>
        <td>${amanWakasek(izin.tanggal)}</td>
        <td>${amanWakasek(izin.namaSiswa)}</td>
        <td>${amanWakasek(izin.nisn)}</td>
        <td>${amanWakasek(izin.kelas)}</td>
        <td>${amanWakasek(izin.alasan)}</td>
        <td>${amanWakasek(izin.waktuKeluar)}</td>
        <td>${amanWakasek(izin.waktuKembali)}</td>
        <td>${amanWakasek(izin.waliNama)}</td>
        <td>
          <button
            type="button"
            data-aksi-izin="setujui"
            data-id="${amanWakasek(izin.id)}">
            Setujui
          </button>

          <button
            type="button"
            class="secondary-button"
            data-aksi-izin="tolak"
            data-id="${amanWakasek(izin.id)}">
            Tolak
          </button>
        </td>
      </tr>
    `).join("");

  } catch (error) {
    console.error("Gagal memuat pengajuan Wakasek:", error);

    tabelIzinWakasek.innerHTML =
      '<tr><td colspan="10">Data gagal dimuat.</td></tr>';

    pesanWakasek(
      "Gagal memuat data. Periksa koneksi, login, dan Firestore Rules."
    );
  }
}

async function prosesKeputusanIzin(idIzin, keputusan) {
  if (!profilAktif || profilAktif.role !== "wakasek") {
    pesanWakasek("Akses ditolak. Silakan login sebagai Wakasek.");
    return;
  }

  const konfirmasi = keputusan === "disetujui"
    ? "Apakah pengajuan izin ini akan disetujui?"
    : "Apakah pengajuan izin ini akan ditolak?";

  if (!window.confirm(konfirmasi)) {
    return;
  }

  pesanWakasek("Menyimpan keputusan...");

  try {
    const izinRef = doc(db, "izin", idIzin);
    const izinSnap = await getDoc(izinRef);

    if (!izinSnap.exists()) {
      pesanWakasek("Pengajuan tidak ditemukan.");
      await muatIzinWakasek();
      return;
    }

    const dataIzin = izinSnap.data();

    if (dataIzin.statusWakasek !== "menunggu") {
      pesanWakasek("Pengajuan ini sudah diproses oleh pengguna lain.");
      await muatIzinWakasek();
      return;
    }

    await updateDoc(izinRef, {
      statusWakasek: keputusan,
      wakasekId: auth.currentUser.uid,
      updatedAt: serverTimestamp()
    });

    pesanWakasek(
      keputusan === "disetujui"
        ? "Pengajuan berhasil disetujui."
        : "Pengajuan berhasil ditolak."
    );

    await muatIzinWakasek();

  } catch (error) {
    console.error("Gagal menyimpan keputusan:", error);

    pesanWakasek(
      "Keputusan gagal disimpan. Periksa Firestore Rules dan koneksi."
    );
  }
}

// Tombol keputusan pada tabel.
if (tabelIzinWakasek) {
  tabelIzinWakasek.addEventListener("click", async event => {
    const tombol = event.target.closest("button[data-aksi-izin]");

    if (!tombol) return;

    const idIzin = tombol.dataset.id;
    const aksi = tombol.dataset.aksiIzin;

    if (!idIzin) return;

    const keputusan = aksi === "setujui"
      ? "disetujui"
      : "ditolak";

    await prosesKeputusanIzin(idIzin, keputusan);
  });
}

// Tombol muat ulang.
if (refreshIzinWakasek) {
  refreshIzinWakasek.addEventListener("click", muatIzinWakasek);
}


// =====================================================
// ADMIN: DATA SISWA
// =====================================================

async function muatDaftarSiswa() {
  if (!auth?.currentUser || profilAktif?.role !== "admin") return;

  studentCount.textContent = "Memuat data siswa...";
  setPesanSiswa("");

  try {
    const snapshot = await getDocs(collection(db, "siswa"));

    daftarSiswa = snapshot.docs.map(dok => ({
      id: dok.id,
      ...dok.data()
    }));

    daftarSiswa.sort((a, b) =>
      String(a.nama || "").localeCompare(String(b.nama || ""), "id")
    );

    tampilkanDaftarSiswa();
  } catch (error) {
    console.error("Gagal memuat siswa:", error);
    studentCount.textContent = "Data siswa gagal dimuat.";
    setPesanSiswa(
      "Tidak dapat membaca koleksi siswa. Periksa Firestore Rules dan koneksi."
    );
  }
}

function tampilkanDaftarSiswa() {
  if (profilAktif?.role !== "admin") return;

  const kata = studentSearch.value.trim().toLocaleLowerCase("id");

  const hasil = daftarSiswa.filter(siswa => {
    const teks = [
      siswa.nama || "",
      siswa.nisn || "",
      siswa.kelas || ""
    ].join(" ").toLocaleLowerCase("id");

    return teks.includes(kata);
  });

  studentCount.textContent =
    `Menampilkan ${hasil.length} dari ${daftarSiswa.length} siswa.`;

  studentTableBody.replaceChildren();

  if (hasil.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "Tidak ada data siswa yang cocok.";
    tr.appendChild(td);
    studentTableBody.appendChild(tr);
    return;
  }

  hasil.forEach((siswa, index) => {
    const tr = document.createElement("tr");

    const nilai = [
      String(index + 1),
      siswa.nama || "",
      String(siswa.nisn || ""),
      siswa.kelas || "",
      siswa.aktif === false ? "Tidak aktif" : "Aktif"
    ];

    nilai.forEach(teks => {
      const td = document.createElement("td");
      td.textContent = teks;
      tr.appendChild(td);
    });

    const aksiTd = document.createElement("td");

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "student-edit-button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => isiFormSiswa(siswa));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "student-delete-button";
    deleteButton.textContent = "Hapus";
    deleteButton.addEventListener("click", () => hapusSiswa(siswa));

    aksiTd.append(editButton, deleteButton);
    tr.appendChild(aksiTd);
    studentTableBody.appendChild(tr);
  });
}

function isiFormSiswa(siswa) {
  studentIdInput.value = siswa.id;
  studentNamaInput.value = siswa.nama || "";
  studentNisnInput.value = String(siswa.nisn || "");
  studentKelasInput.value = siswa.kelas || "";

  saveStudentButton.textContent = "Simpan Perubahan";
  setPesanSiswa(`Mengubah data: ${siswa.nama || siswa.nisn}`);
  studentNamaInput.focus();
}

function bersihkanFormSiswa() {
  studentIdInput.value = "";
  studentNamaInput.value = "";
  studentNisnInput.value = "";
  studentKelasInput.value = "";
  saveStudentButton.textContent = "Simpan Siswa";
}

async function nisnSudahAda(nisn, kecualiId = "") {
  const q = query(
    collection(db, "siswa"),
    where("nisn", "==", nisn)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.some(dok => dok.id !== kecualiId);
}

async function simpanSiswa() {
  if (profilAktif?.role !== "admin" || !auth?.currentUser) {
    setPesanSiswa("Hanya admin yang boleh mengelola data siswa.");
    return;
  }

  if (sedangMemprosesSiswa) return;

  const id = studentIdInput.value.trim();
  const nama = studentNamaInput.value.trim();
  const nisn = studentNisnInput.value.trim();
  const kelas = studentKelasInput.value.trim();

  if (!nama || !nisn || !kelas) {
    setPesanSiswa("Nama, NISN, dan kelas wajib diisi.");
    return;
  }

  if (!/^\d{5,20}$/.test(nisn)) {
    setPesanSiswa("NISN harus berupa 5–20 digit angka. Periksa kembali.");
    return;
  }

  sedangMemprosesSiswa = true;
  saveStudentButton.disabled = true;

  try {
    if (await nisnSudahAda(nisn, id)) {
      setPesanSiswa("NISN tersebut sudah digunakan oleh siswa lain.");
      return;
    }

    const dataSiswa = {
      nama,
      nisn,
      kelas,
      aktif: true,
      diperbaruiPada: serverTimestamp()
    };

    if (id) {
      await updateDoc(doc(db, "siswa", id), dataSiswa);
      setPesanSiswa("Perubahan data siswa berhasil disimpan.");
    } else {
      await addDoc(collection(db, "siswa"), {
        ...dataSiswa,
        dibuatPada: serverTimestamp()
      });
      setPesanSiswa("Siswa berhasil ditambahkan.");
    }

    bersihkanFormSiswa();
    await muatDaftarSiswa();
  } catch (error) {
    console.error("Gagal menyimpan siswa:", error);
    setPesanSiswa(
      error.code === "permission-denied"
        ? "Akses ditolak oleh Firestore Rules. Pastikan akun ini memiliki role admin."
        : "Gagal menyimpan siswa. Periksa koneksi dan konfigurasi Firebase."
    );
  } finally {
    sedangMemprosesSiswa = false;
    saveStudentButton.disabled = false;
  }
}

async function hapusSiswa(siswa) {
  if (profilAktif?.role !== "admin" || !auth?.currentUser) {
    setPesanSiswa("Hanya admin yang boleh menghapus data siswa.");
    return;
  }

  const yakin = window.confirm(
    `Hapus data siswa ${siswa.nama || siswa.nisn}?\n\n` +
    "Pastikan data ini tidak sedang digunakan pada data izin."
  );

  if (!yakin) return;

  try {
    await deleteDoc(doc(db, "siswa", siswa.id));
    setPesanSiswa("Data siswa berhasil dihapus.");
    await muatDaftarSiswa();
  } catch (error) {
    console.error("Gagal menghapus siswa:", error);
    setPesanSiswa(
      "Gagal menghapus data. Periksa Firestore Rules dan koneksi."
    );
  }
}

// =====================================================
// ADMIN: IMPOR CSV
// Format header: nama,nisn,kelas
// =====================================================

function parseCSV(teks) {
  const baris = [];
  let kolom = [];
  let nilai = "";
  let dalamKutip = false;

  teks = teks.replace(/^\uFEFF/, "");

  for (let i = 0; i < teks.length; i++) {
    const karakter = teks[i];
    const berikutnya = teks[i + 1];

    if (karakter === '"') {
      if (dalamKutip && berikutnya === '"') {
        nilai += '"';
        i++;
      } else {
        dalamKutip = !dalamKutip;
      }
    } else if (karakter === ";" && !dalamKutip) {
      kolom.push(nilai.trim());
      nilai = "";
    } else if (
      (karakter === "\n" || karakter === "\r") &&
      !dalamKutip
    ) {
      if (karakter === "\r" && berikutnya === "\n") i++;

      kolom.push(nilai.trim());

      if (kolom.some(item => item !== "")) {
        baris.push(kolom);
      }

      kolom = [];
      nilai = "";
    } else {
      nilai += karakter;
    }
  }

  if (nilai.length > 0 || kolom.length > 0) {
    kolom.push(nilai.trim());
    if (kolom.some(item => item !== "")) baris.push(kolom);
  }

  return baris;
}

function normalisasiHeader(teks) {
  return String(teks || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

async function imporCSV() {
  if (profilAktif?.role !== "admin" || !auth?.currentUser) {
    setPesanSiswa("Hanya admin yang boleh mengimpor data siswa.");
    return;
  }

  const file = studentCsvFile.files[0];

  if (!file) {
    setPesanSiswa("Pilih file CSV terlebih dahulu.");
    return;
  }

  if (sedangMemprosesSiswa) return;

  sedangMemprosesSiswa = true;
  importStudentButton.disabled = true;

  try {
    const teks = await file.text();
    const baris = parseCSV(teks);

    if (baris.length < 2) {
      setPesanSiswa("CSV kosong atau hanya berisi judul kolom.");
      return;
    }

    // Terima nama header seperti nama, Nama, NISN, atau nisn.
    // Pemisah yang didukung: koma.
    const header = baris[0].map(normalisasiHeader);
    const idxNama = header.indexOf("nama");
    const idxNisn = header.indexOf("nisn");
    const idxKelas = header.indexOf("kelas");

    if (idxNama < 0 || idxNisn < 0 || idxKelas < 0) {
      setPesanSiswa(
        "Header wajib: nama, nisn, kelas. Gunakan pemisah koma."
      );
      return;
    }

    const dataCSV = [];
    const nisnDiFile = new Set();
    let barisTidakValid = 0;
    let nisnDuplikatDiFile = 0;

    for (let i = 1; i < baris.length; i++) {
      const row = baris[i];
      const nama = String(row[idxNama] || "").trim();
      const nisn = String(row[idxNisn] || "").trim();
      const kelas = String(row[idxKelas] || "").trim();

      if (!nama || !kelas || !/^\d{5,20}$/.test(nisn)) {
        barisTidakValid++;
        continue;
      }

      if (nisnDiFile.has(nisn)) {
        nisnDuplikatDiFile++;
        continue;
      }

      nisnDiFile.add(nisn);
      dataCSV.push({ nama, nisn, kelas });
    }

    if (dataCSV.length === 0) {
      setPesanSiswa(
        "Tidak ada baris valid. Periksa nama, NISN, dan kelas pada CSV."
      );
      return;
    }

    // Ambil NISN yang sudah tersimpan agar impor tidak menambah duplikat.
    const snapshotLama = await getDocs(collection(db, "siswa"));
    const nisnLama = new Set(
      snapshotLama.docs.map(dok => String(dok.data().nisn || "").trim())
    );

    const dataBaru = dataCSV.filter(siswa => !nisnLama.has(siswa.nisn));
    const duplikatFirestore = dataCSV.length - dataBaru.length;

    if (dataBaru.length === 0) {
      setPesanSiswa(
        `Tidak ada data baru. Semua ${dataCSV.length} NISN valid sudah ada di database.`
      );
      return;
    }

    // Batasi batch di bawah batas maksimum operasi Firestore.
    let totalTersimpan = 0;

    for (let awal = 0; awal < dataBaru.length; awal += 400) {
      const bagian = dataBaru.slice(awal, awal + 400);
      const batch = writeBatch(db);

      for (const siswa of bagian) {
        const refBaru = doc(collection(db, "siswa"));
        batch.set(refBaru, {
          ...siswa,
          aktif: true,
          dibuatPada: serverTimestamp(),
          diperbaruiPada: serverTimestamp()
        });
      }

      await batch.commit();
      totalTersimpan += bagian.length;
    }

    studentCsvFile.value = "";

    setPesanSiswa(
      `Impor selesai. Berhasil ditambahkan: ${totalTersimpan}. ` +
      `Duplikat di database: ${duplikatFirestore}. ` +
      `Duplikat di file: ${nisnDuplikatDiFile}. ` +
      `Baris tidak valid: ${barisTidakValid}.`
    );

    await muatDaftarSiswa();
  } catch (error) {
    console.error("Impor CSV gagal:", error);

    setPesanSiswa(
      error.code === "permission-denied"
        ? "Impor ditolak oleh Firestore Rules. Pastikan login menggunakan akun admin dan Rules mengizinkan admin menulis koleksi siswa."
        : "Impor gagal. Periksa format CSV, koneksi, dan Firebase Console."
    );
  } finally {
    sedangMemprosesSiswa = false;
    importStudentButton.disabled = false;
  }
}

function unduhTemplateCSV() {
  const isi = "nama,nisn,kelas\nAndi Saputra,0091234567,X-1\n";
  const blob = new Blob(["\uFEFF", isi], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "template-data-siswa.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// =====================================================
// Tahap 6 : fungsi untuk memilih siswa dan mengirim pengajuan
// =====================================================

function pesanIzin(pesan) {
  izinMessage.textContent = pesan;
}

function tanggalHariIni() {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
  const hari = String(sekarang.getDate()).padStart(2, "0");
  return `${tahun}-${bulan}-${hari}`;
}

async function muatPilihanSiswaWali() {
  if (!auth?.currentUser || profilAktif?.role !== "wali") return;

  const kelasWali = String(profilAktif.kelasWali || "").trim();

  izinSiswa.replaceChildren();

  const opsiAwal = document.createElement("option");
  opsiAwal.value = "";
  opsiAwal.textContent = "Pilih siswa";
  izinSiswa.appendChild(opsiAwal);

  if (!kelasWali) {
    pesanIzin("Kelas wali belum diatur. Hubungi administrator.");
    return;
  }

  izinTanggal.min = tanggalHariIni();
  if (!izinTanggal.value) izinTanggal.value = tanggalHariIni();

  izinSiswa.disabled = true;
  submitIzinButton.disabled = true;
  pesanIzin("Memuat siswa kelas " + kelasWali + "...");

  try {
    // Query dibatasi pada kelas wali dan siswa aktif.
    const q = query(
      collection(db, "siswa"),
      where("kelas", "==", kelasWali),
      where("aktif", "==", true)
    );

    const snapshot = await getDocs(q);

    const siswaKelas = snapshot.docs.map(dok => ({
      id: dok.id,
      ...dok.data()
    }));

    siswaKelas.sort((a, b) =>
      String(a.nama || "").localeCompare(String(b.nama || ""), "id")
    );

    for (const siswa of siswaKelas) {
      const opsi = document.createElement("option");
      opsi.value = siswa.id;
      opsi.textContent =
        `${siswa.nama || "(Tanpa nama)"} — ${siswa.nisn || "-"}`;
      izinSiswa.appendChild(opsi);
    }

    if (siswaKelas.length === 0) {
      pesanIzin(
        `Belum ada siswa aktif di kelas ${kelasWali}. Periksa data siswa.`
      );
    } else {
      pesanIzin(
        `Ditemukan ${siswaKelas.length} siswa aktif di kelas ${kelasWali}.`
      );
    }
  } catch (error) {
    console.error("Gagal memuat siswa untuk wali:", error);

    pesanIzin(
      error.code === "permission-denied"
        ? "Akses daftar siswa ditolak. Periksa Firestore Rules pada koleksi siswa."
        : "Gagal memuat siswa. Periksa koneksi Firebase."
    );
  } finally {
    izinSiswa.disabled = false;
    submitIzinButton.disabled = false;
  }

  await muatRiwayatIzinWali();
}

async function kirimPengajuanIzin(event) {
  event.preventDefault();

  if (profilAktif?.role !== "wali" || !auth?.currentUser) {
    pesanIzin("Silakan login dengan akun wali kelas.");
    return;
  }

  if (sedangMemprosesSiswa) return;

  const siswaId = izinSiswa.value;
  const tanggal = izinTanggal.value;
  const alasan = izinAlasan.value.trim();
  const waktuKeluar = izinWaktuKeluar.value;
  const waktuKembali = izinWaktuKembali.value;
  const kelasWali = String(profilAktif.kelasWali || "").trim();

  if (
    !siswaId ||
    !tanggal ||
    !alasan ||
    !waktuKeluar ||
    !waktuKembali
  ) {
    pesanIzin("Lengkapi semua kolom pengajuan izin.");
    return;
  }

  if (tanggal < tanggalHariIni()) {
    pesanIzin("Tanggal izin tidak boleh lebih awal dari hari ini.");
    return;
  }

  if (waktuKembali <= waktuKeluar) {
    pesanIzin(
      "Waktu kembali harus lebih akhir daripada waktu keluar. " +
      "Jika izin melewati tengah malam, ajukan dengan mekanisme terpisah."
    );
    return;
  }

  sedangMemprosesSiswa = true;
  submitIzinButton.disabled = true;
  submitIzinButton.textContent = "Menyimpan...";

  try {
    // Ambil ulang dokumen siswa agar data pengajuan berasal dari Firestore.
    const siswaRef = doc(db, "siswa", siswaId);
    const siswaSnap = await getDoc(siswaRef);

    if (!siswaSnap.exists()) {
      pesanIzin("Data siswa tidak ditemukan. Muat ulang daftar siswa.");
      return;
    }

    const siswa = siswaSnap.data();

    // Validasi tambahan di aplikasi; Firestore Rules tetap wajib memvalidasi.
    if (
      siswa.aktif !== true ||
      String(siswa.kelas || "").trim() !== kelasWali
    ) {
      pesanIzin("Siswa tidak aktif atau bukan dari kelas tanggung jawab Anda.");
      await muatPilihanSiswaWali();
      return;
    }

    const uid = auth.currentUser.uid;

    await addDoc(collection(db, "izin"), {
      siswaId,
      namaSiswa: String(siswa.nama || ""),
      nisn: String(siswa.nisn || ""),
      kelas: String(siswa.kelas || ""),
      tanggal,
      alasan,
      waktuKeluar,
      waktuKembali,

      waliId: uid,
      waliNama: String(profilAktif.nama || ""),
      statusWali: "disetujui",

      wakasekId: "",
      statusWakasek: "menunggu",

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    izinForm.reset();
    izinTanggal.value = tanggalHariIni();

    pesanIzin("Pengajuan izin berhasil dikirim dan menunggu persetujuan wakasek.");

    await muatRiwayatIzinWali();
  } catch (error) {
    console.error("Gagal mengirim pengajuan izin:", error);

    pesanIzin(
      error.code === "permission-denied"
        ? "Pengajuan ditolak oleh Firestore Rules. Periksa aturan create koleksi izin."
        : "Pengajuan gagal disimpan. Periksa koneksi dan konfigurasi Firebase."
    );
  } finally {
    sedangMemprosesSiswa = false;
    submitIzinButton.disabled = false;
    submitIzinButton.textContent = "Ajukan Izin";
  }
}

async function muatRiwayatIzinWali() {
  if (!auth?.currentUser || profilAktif?.role !== "wali") return;

  riwayatIzinWali.replaceChildren();

  try {
    const q = query(
      collection(db, "izin"),
      where("waliId", "==", auth.currentUser.uid)
    );

    const snapshot = await getDocs(q);

    const riwayat = snapshot.docs.map(dok => ({
      id: dok.id,
      ...dok.data()
    }));

    riwayat.sort((a, b) =>
      String(b.tanggal || "").localeCompare(String(a.tanggal || ""))
    );

    if (riwayat.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.textContent = "Belum ada pengajuan izin.";
      tr.appendChild(td);
      riwayatIzinWali.appendChild(tr);
      return;
    }

    for (const item of riwayat) {
      const tr = document.createElement("tr");

      const status = item.statusWakasek === "disetujui"
        ? "Disetujui"
        : item.statusWakasek === "ditolak"
          ? "Ditolak"
          : "Menunggu";

      const kolom = [
        item.tanggal || "-",
        item.namaSiswa || "-",
        item.kelas || "-",
        item.alasan || "-",
        `${item.waktuKeluar || "-"}–${item.waktuKembali || "-"}`,
        status
      ];

      for (const isi of kolom) {
        const td = document.createElement("td");
        td.textContent = isi;
        tr.appendChild(td);
      }

      riwayatIzinWali.appendChild(tr);
    }
  } catch (error) {
    console.error("Gagal memuat riwayat izin:", error);

    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent =
      "Riwayat gagal dimuat. Periksa Firestore Rules koleksi izin.";
    tr.appendChild(td);
    riwayatIzinWali.appendChild(tr);
  }
}


// =====================================================
// PERBAIKAN: TABEL IZIN PUBLIK
// =====================================================

let berhentiPantauIzinPublik = null;

function pantauTabelIzinPublik() {
  const tabel = document.getElementById("izinTableBody");

  if (!tabel) {
    console.warn(
      "izinTableBody tidak ditemukan. Periksa ID tabel pada index.html."
    );
    return;
  }

  // Hindari listener ganda.
  if (berhentiPantauIzinPublik) {
    berhentiPantauIzinPublik();
    berhentiPantauIzinPublik = null;
  }

  tabel.innerHTML =
    '<tr><td colspan="7">Memuat data izin...</td></tr>';

  // Sesuai Firestore Rules: hanya izin yang disetujui wali
  // dan sudah disetujui Wakasek yang ditampilkan.
  const q = query(
    collection(db, "izin"),
    where("statusWali", "==", "disetujui"),
    where("statusWakasek", "==", "disetujui")
  );

  berhentiPantauIzinPublik = onSnapshot(
    q,
    (snapshot) => {
      const tanggalTerpilih = filterTanggal?.value || "";

      const daftar = snapshot.docs
        .map(dokumen => ({
          id: dokumen.id,
          ...dokumen.data()
        }))
        .filter(izin =>
          !tanggalTerpilih || izin.tanggal === tanggalTerpilih
        )
        .sort((a, b) =>
          String(b.tanggal || "").localeCompare(
            String(a.tanggal || "")
          )
        );

      if (daftar.length === 0) {
        tabel.innerHTML =
          '<tr><td colspan="7">Tidak ada izin yang disetujui pada tanggal tersebut.</td></tr>';
        return;
      }

      tabel.innerHTML = daftar.map((izin, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${teksAmanTahap8(izin.tanggal)}</td>
          <td>${teksAmanTahap8(izin.namaSiswa)}</td>
          <td>${teksAmanTahap8(izin.kelas)}</td>
          <td>${teksAmanTahap8(izin.alasan)}</td>
          <td>${teksAmanTahap8(izin.waktuKeluar)} - ${teksAmanTahap8(izin.waktuKembali)}</td>
          <td>Disetujui</td>
        </tr>
      `).join("");
    },
    (error) => {
      console.error("Gagal memantau izinTableBody:", error);

      tabel.innerHTML =
        '<tr><td colspan="7">Gagal memuat data izin. Periksa Firestore Rules.</td></tr>';
    }
  );
}


// =====================================================
// EVENT LISTENERS
// =====================================================

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
  if (!loginPanel.hidden) $("email").focus();
});

cancelLogin.addEventListener("click", sembunyikanLogin);

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (sedangMemprosesLogin) return;

  if (!auth) {
    loginMessage.textContent = "Firebase belum dikonfigurasi.";
    return;
  }

  const email = $("email").value.trim();
  const password = $("password").value;

  sedangMemprosesLogin = true;
  const tombol = loginForm.querySelector('button[type="submit"]');
  tombol.disabled = true;
  tombol.textContent = "Memeriksa akun...";
  loginMessage.textContent = "";

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Login gagal:", error);

    if ([
      "auth/invalid-credential",
      "auth/wrong-password",
      "auth/user-not-found"
    ].includes(error.code)) {
      loginMessage.textContent = "Email atau kata sandi tidak benar.";
    } else if (error.code === "auth/invalid-email") {
      loginMessage.textContent = "Format email tidak valid.";
    } else if (error.code === "auth/too-many-requests") {
      loginMessage.textContent = "Terlalu banyak percobaan. Coba lagi nanti.";
    } else {
      loginMessage.textContent =
        "Login gagal. Periksa konfigurasi Firebase dan domain.";
    }
  } finally {
    sedangMemprosesLogin = false;
    tombol.disabled = false;
    tombol.textContent = "Masuk";
  }
});

saveStudentButton.addEventListener("click", simpanSiswa);
resetStudentButton.addEventListener("click", () => {
  bersihkanFormSiswa();
  setPesanSiswa("");
});

studentSearch.addEventListener("input", tampilkanDaftarSiswa);
importStudentButton.addEventListener("click", imporCSV);
downloadCsvTemplateButton.addEventListener("click", unduhTemplateCSV);

filterTanggal.value = formatTanggalLokal(new Date());

filterTanggal.addEventListener("change", () => {
  tampilkanTanggal();

  // Muat ulang pemantauan agar tabel memakai tanggal terbaru.
  if (db) {
    pantauTabelIzinPublik();
  }
});

tampilkanTanggal();



sembunyikanDashboard();

//=========
// Penambahan LIstener pada tahap 6

izinForm.addEventListener("submit", kirimPengajuanIzin);

resetIzinButton.addEventListener("click", () => {
  izinForm.reset();
  izinTanggal.value = tanggalHariIni();
  pesanIzin("");
});




//=========

if (!konfigurasiValid()) {
  loginButton.disabled = true;
  setStatus("Konfigurasi Firebase belum diisi. Edit firebaseConfig di app.js.");
} else {
  try {
   const app = initializeApp(firebaseConfig);
auth = getAuth(app);
db = getFirestore(app);

pantauTabelIzinPublik();

    onAuthStateChanged(auth, async user => {
      if (user) {
        await periksaProfil(user);
      } else {
        sembunyikanDashboard();
        loginButton.textContent = "Login";
        setStatus("Aplikasi siap. Login untuk membuka dashboard pengguna.");
      }
    });

    setStatus("Aplikasi siap. Login untuk membuka dashboard pengguna.");
  } catch (error) {
    console.error("Inisialisasi Firebase gagal:", error);
    setStatus("Aplikasi gagal terhubung ke Firebase. Periksa konfigurasi.");
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (error) {
      console.error("Service worker gagal:", error);
    }
  });
}
