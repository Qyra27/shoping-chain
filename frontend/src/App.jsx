import { useState, useEffect } from "react";
import { nativeToScVal } from "@stellar/stellar-sdk";
import { useContract } from "./hooks/useContract";

// - Styles --------------------------
const s = {
  app: { maxWidth: 600, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: "1px solid #e5e7eb" },
  title: { fontSize: "1.25rem", fontWeight: 700, margin: 0 },
  btnPrimary: { background: "#6366f1", color: "#fff", border: "none", padding: "0.5rem 1.1rem", borderRadius: 8, cursor: "pointer", fontWeight: 500 },
  btnOutline: { background: "transparent", color: "#374151", border: "1px solid #d1d5db", padding: "0.5rem 1.1rem", borderRadius: 8, cursor: "pointer" },
  btnDanger: { background: "#ef4444", color: "#fff", border: "none", padding: "0.35rem 0.8rem", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem" },
  walletInfo: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  address: { fontSize: "0.8rem", color: "#6b7280", fontFamily: "monospace", background: "#f3f4f6", padding: "0.4rem 0.75rem", borderRadius: 6 },
  balance: { fontSize: "0.75rem", color: "#6366f1", fontWeight: 600 },
  walletRow: { display: "flex", alignItems: "center", gap: 10 },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "1.25rem", marginBottom: "0.75rem" },
  form: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "1.25rem", marginBottom: "1.5rem" },
  input: { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "0.55rem 0.75rem", fontSize: "0.95rem", boxSizing: "border-box", marginBottom: "0.75rem", outline: "none" },
  label: { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" },
  error: { color: "#ef4444", fontSize: "0.85rem", margin: "0.5rem 0" },
  success: { color: "#16a34a", fontSize: "0.85rem", margin: "0.5rem 0" },
  noteTitle: { margin: "0 0 0.3rem", fontSize: "1rem", fontWeight: 600 },
  noteBody: { margin: "0 0 0.75rem", color: "#6b7280", fontSize: "0.9rem" },
  noteFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  noteId: { fontSize: "0.7rem", color: "#9ca3af", fontFamily: "monospace" },
  sectionTitle: { fontWeight: 600, marginBottom: "1rem", color: "#111827" },
  empty: { textAlign: "center", color: "#9ca3af", padding: "2rem 0", fontSize: "0.9rem" },
};

export default function App() {
  // - Hook - semua fungsi wallet & contract ada di sini ---
  const {
    publicKey,
    isWalletConnected,
    walletLoading,
    walletError,
    connectWallet,
    disconnectWallet,
    readContract,
    writeContract,
    txLoading,
    txError,
    txSuccess,
    xlmBalance,
  } = useContract();

  // - State lokal ----------------------
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Load notes saat pertama kali halaman dibuka
  useEffect(() => {
    loadNotes();
  }, []);

  // - Fungsi-fungsi ---------------------

  async function loadNotes() {
    const data = await readContract("get_notes");
    setNotes(data || []);
  }

  async function handleCreate() {
    await writeContract("create_note", [
      nativeToScVal(title, { type: "string" }),
      nativeToScVal(content, { type: "string" }),
    ]);
    setTitle("");
    setContent("");
    await loadNotes();
  }

  async function handleDelete(id) {
    await writeContract("delete_note", [
      nativeToScVal(id, { type: "u64" }),
    ]);
    await loadNotes();
  }

  // - UI ---------------------------
  return (
    <div style={s.app}>

      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Notes DApp</h1>

        {isWalletConnected ? (
          <div style={s.walletInfo}>
            <div style={s.walletRow}>
              <span style={s.address}>
                {publicKey.slice(0, 6)}...{publicKey.slice(-6)}
              </span>
              <button style={s.btnOutline} onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
            {xlmBalance !== null && (
              <span style={s.balance}>
                {parseFloat(xlmBalance).toFixed(2)} XLM
              </span>
            )}
          </div>
        ) : (
          <button style={s.btnPrimary} onClick={connectWallet} disabled={walletLoading}>
            {walletLoading ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>

      {/* Error & status transaksi */}
      {walletError && <p style={s.error}>⚠ {walletError}</p>}
      {txError && <p style={s.error}>⚠ {txError}</p>}
      {txSuccess && <p style={s.success}>✓ Transaction confirmed!</p>}

      {/* Form buat note - hanya muncul kalau wallet sudah connect */}
      {isWalletConnected && (
        <div style={s.form}>
          <p style={s.sectionTitle}>New Note</p>

          <label style={s.label}>Title</label>
          <input
            style={s.input}
            placeholder="Enter title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label style={s.label}>Content</label>
          <input
            style={s.input}
            placeholder="Enter content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button
            style={s.btnPrimary}
            onClick={handleCreate}
            disabled={txLoading || !title || !content}
          >
            {txLoading ? "Saving..." : "Save Note"}
          </button>
        </div>
      )}

      {/* Daftar notes */}
      <p style={s.sectionTitle}>All Notes ({notes.length})</p>

      {notes.length === 0 ? (
        <p style={s.empty}>No notes yet.</p>
      ) : (
        notes.map((note) => (
          <div key={note.id} style={s.card}>
            <h3 style={s.noteTitle}>{note.title}</h3>
            <p style={s.noteBody}>{note.content}</p>
            <div style={s.noteFooter}>
              <span style={s.noteId}>id: {note.id?.toString()}</span>
              {isWalletConnected && (
                <button
                  style={s.btnDanger}
                  onClick={() => handleDelete(note.id)}
                  disabled={txLoading}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))
      )}

    </div>
  );
}