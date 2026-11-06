import { useEffect, useState } from "react";
import { FILE_READY, shareOrDownload } from "../lib/export.js";

// Muncul bila HP menolak membuka lembar Bagikan otomatis (ketukan sudah kedaluwarsa).
export default function FileReadyBar() {
  const [file, setFile] = useState(null);
  useEffect(() => {
    const onReady = (e) => setFile(e.detail.file);
    window.addEventListener(FILE_READY, onReady);
    return () => window.removeEventListener(FILE_READY, onReady);
  }, []);
  if (!file) return null;
  return (
    <div className="file-bar" role="status">
      <span className="file-bar-name">File siap: {file.name}</span>
      <button className="btn" onClick={async () => { if (await shareOrDownload(file)) setFile(null); }}>Simpan</button>
      <button className="btn-ghost" onClick={() => setFile(null)}>Tutup</button>
    </div>
  );
}
