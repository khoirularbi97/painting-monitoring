import { useEffect, useState } from "react";
import PaginatedTable from "../components/PaginatedTable.jsx";
import { api, extractErrors } from "../lib/api.js";

const ENTITY_CONFIG = {
  line: {
    label: "Line",
    endpoint: "/master/line",
    nameField: "nama_line",
    displayLabel: "Nama line",
    extraFields: [],
  },
  shift: {
    label: "Shift",
    endpoint: "/master/shift",
    nameField: "nama_shift",
    displayLabel: "Nama shift",
    extraFields: [
      { key: "jam_mulai", label: "Jam mulai", type: "time" },
      { key: "jam_selesai", label: "Jam selesai", type: "time" },
    ],
  },
  customer: {
    label: "Customer",
    endpoint: "/master/customer",
    nameField: "nama_customer",
    displayLabel: "Nama customer",
    extraFields: [],
  },
  leader: {
    label: "Leader",
    endpoint: "/master/leader",
    nameField: "nama_leader",
    displayLabel: "Nama leader",
    extraFields: [],
  },
};

function MasterTable({ entityKey }) {
  const cfg = ENTITY_CONFIG[entityKey];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState({});
  const [errors, setErrors] = useState([]);

  function load() {
    setLoading(true);
    api.get(cfg.endpoint).then((r) => setRows(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); setEditingId(null); setAdding(false); setErrors([]); }, [entityKey]);

  function startEdit(row) {
    setEditingId(row.id);
    setForm({ ...row });
    setErrors([]);
  }

  async function saveEdit(id) {
    setErrors([]);
    try {
      await api.put(`${cfg.endpoint}/${id}`, form);
      setEditingId(null);
      load();
    } catch (err) {
      setErrors(extractErrors(err));
    }
  }

  async function handleDelete(id) {
    if (!confirm(`Hapus ${cfg.label.toLowerCase()} ini?`)) return;
    setErrors([]);
    try {
      await api.delete(`${cfg.endpoint}/${id}`);
      load();
    } catch (err) {
      setErrors(extractErrors(err));
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setErrors([]);
    try {
      await api.post(cfg.endpoint, newForm);
      setNewForm({});
      setAdding(false);
      load();
    } catch (err) {
      setErrors(extractErrors(err));
    }
  }

  return (
    <div>
      {errors.length > 0 && (
        <div className="alert-error">{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
      )}

      {loading ? (
        <p className="empty-note">Memuat data...</p>
      ) : (
        <div>
          <PaginatedTable
            rows={rows}
            defaultPageSize={10}
            searchable
            searchKeys={[cfg.nameField, ...cfg.extraFields.map((f) => f.key)]}
            searchPlaceholder={`Cari ${cfg.label.toLowerCase()}...`}
          >
            {(currentRows) => (
              <table>
                <thead>
                  <tr>
                    <th>{cfg.displayLabel}</th>
                    {cfg.extraFields.map((f) => <th key={f.key}>{f.label}</th>)}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row) => (
                    <tr key={row.id}>
                      {editingId === row.id ? (
                        <>
                          <td>
                            <input
                              value={form[cfg.nameField] || ""}
                              onChange={(e) => setForm({ ...form, [cfg.nameField]: e.target.value })}
                            />
                          </td>
                          {cfg.extraFields.map((f) => (
                            <td key={f.key}>
                              <input
                                type={f.type}
                                value={form[f.key] || ""}
                                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                              />
                            </td>
                          ))}
                          <td>
                            <div className="row-actions">
                              <button className="btn" onClick={() => saveEdit(row.id)}>Simpan</button>
                              <button className="btn-ghost" onClick={() => setEditingId(null)}>Batal</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{row[cfg.nameField]}</td>
                          {cfg.extraFields.map((f) => <td key={f.key}>{row[f.key] || "-"}</td>)}
                          <td>
                            <div className="row-actions">
                              <button className="btn-ghost" onClick={() => startEdit(row)}>Edit</button>
                              <button className="btn-ghost btn-danger" onClick={() => handleDelete(row.id)}>Hapus</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}

                  {adding && (
                    <tr>
                      <td>
                        <input
                          autoFocus
                          value={newForm[cfg.nameField] || ""}
                          onChange={(e) => setNewForm({ ...newForm, [cfg.nameField]: e.target.value })}
                          placeholder={cfg.displayLabel}
                        />
                      </td>
                      {cfg.extraFields.map((f) => (
                        <td key={f.key}>
                          <input
                            type={f.type}
                            value={newForm[f.key] || ""}
                            onChange={(e) => setNewForm({ ...newForm, [f.key]: e.target.value })}
                          />
                        </td>
                      ))}
                      <td>
                        <div className="row-actions">
                          <button className="btn" onClick={handleAdd}>Tambah</button>
                          <button className="btn-ghost" onClick={() => { setAdding(false); setNewForm({}); }}>Batal</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </PaginatedTable>
        </div>
      )}

      {!adding && (
        <button className="btn-ghost" style={{ marginTop: 14 }} onClick={() => setAdding(true)}>
          + Tambah {cfg.label.toLowerCase()}
        </button>
      )}
    </div>
  );
}

export default function KelolaMaster() {
  const [entity, setEntity] = useState("line");

  return (
    <div>
      <h1 className="page-title">Kelola master data</h1>
      <p className="page-subtitle">Tambah, ubah, atau hapus daftar Line, Shift, Customer, dan Leader</p>

      <div className="toolbar" style={{ marginTop: 0 }}>
        <div className="seg" role="tablist">
          {Object.entries(ENTITY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              role="tab"
              aria-selected={entity === key}
              className={"seg-item" + (entity === key ? " active" : "")}
              onClick={() => setEntity(key)}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <MasterTable entityKey={entity} />
      </div>
    </div>
  );
}