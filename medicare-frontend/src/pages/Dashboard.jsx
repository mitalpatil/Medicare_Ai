import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Hospital, Bot, FileText, Trash2, UserPlus, User
} from 'lucide-react';

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const [visibleHistoryId, setVisibleHistoryId] = useState(null);
  const [showNewRecordId, setShowNewRecordId] = useState(null);
  const hospitalName = localStorage.getItem("hospitalName");
  const hospitalId = localStorage.getItem("hospitalId");

  const fetchPatients = async () => {
    const res = await axios.get(`http://localhost:8000/patients/hospital/${hospitalId}`);
    setPatients(res.data);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-4xl font-bold text-blue-700 flex justify-center items-center gap-2">
          <Hospital size={35} /> Hospital Dashboard
        </h2>
        <p className="text-gray-600 text-lg">
          Welcome, <span className="font-semibold">{hospitalName}</span>
        </p>
        <p className="text-gray-500">Total Patients Today: {patients.length}</p>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow-md transition flex items-center gap-2"
        >
          <UserPlus size={18} /> Add Patient
        </button>
      </div>

      {showForm && (
        <AddPatientForm onClose={() => { setShowForm(false); fetchPatients(); }} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patients.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <h3 className="text-2xl font-bold text-blue-800 mb-1 flex items-center gap-2">
              <User size={20} /> {p.name}
            </h3>
            <p><span className="font-semibold text-gray-700">Symptoms:</span> {p.symptoms}</p>
            <p><span className="font-semibold text-gray-700">Contact:</span> {p.contact}</p>
            <p><span className="font-semibold text-gray-700">DOB:</span> {p.dob}</p>

            <div className="mt-4 flex gap-3 flex-wrap">
              <button
                onClick={() => setVisibleHistoryId(visibleHistoryId === p.id ? null : p.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
              >
                {visibleHistoryId === p.id ? "Hide History" : "Show History"}
              </button>

              <button
                onClick={() => setShowNewRecordId(p.id)}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
              >
                ➕ Add New Record
              </button>

              <button
                onClick={() => {
                  localStorage.setItem("selectedPatient", JSON.stringify(p));
                  window.location.href = "/ai-assistant";
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition flex items-center gap-1"
              >
                <Bot size={16} /> Ask AI
              </button>

              <button
                onClick={async () => {
                  if (window.confirm("Are you sure you want to delete this patient?")) {
                    await axios.delete(`http://localhost:8000/patients/${p.id}`);
                    fetchPatients();
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition flex items-center gap-1"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>

            {showNewRecordId === p.id && (
              <AddRecordForm patient={p} onClose={() => setShowNewRecordId(null)} fetchPatients={fetchPatients} />
            )}

            {visibleHistoryId === p.id && (
              <div className="mt-4">
                <p className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <FileText size={16} /> Medical History Records:
                </p>
                <MedicalHistoryList patientId={p.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
function AddPatientForm({ onClose }) {
  const [formData, setFormData] = useState({
    name: '', age: '', contact: '', dob: '', symptoms: '',
    allergies: '', previous_diseases: '', weight: '', height: '', medications: '', 
    document: null,consent: false 
  });

  const [autofillPreview, setAutofillPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const hospitalId = localStorage.getItem("hospitalId");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.document) return alert("Please upload a document");

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "document") data.append(key, value || '');
    });
    data.append("document", formData.document);
    data.append("hospital_id", hospitalId);

    setLoading(true);
    try {
      await axios.post("http://localhost:8000/patients/", data);
      alert("✅ Patient added successfully!");
      onClose();
    } catch (error) {
      console.error("Error submitting patient:", error);
      alert("❌ Submission failed. Check console.");
    }
    setLoading(false);
  };

  const handleAutofill = async () => {
    if (!formData.document) {
      alert("Please upload a document first!");
      return;
    }

    const fd = new FormData();
    fd.append("document", formData.document);

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/patients/extract-info", fd);
      let data = res.data;

      if (data.raw_response && data.raw_response.includes("```")) {
        const match = data.raw_response.match(/```[\s\S]*?({[\s\S]*?})[\s\S]*?```/);
        if (match && match[1]) {
          data = JSON.parse(match[1]);
        } else {
          throw new Error("No valid JSON found in response.");
        }
      }

      const birthYear = new Date(data.birth_date).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;

      setFormData((prev) => ({
        ...prev,
        name: data.name || '',
        dob: data.birth_date || '',
        age: data.age || age || '',
        contact: prev.contact, // keep manually filled contact if any
        symptoms: prev.symptoms,
        allergies: Array.isArray(data.allergies) ? data.allergies.join(', ') : data.allergies || '',
        weight: String(data.weight || ''),
        height: String(data.height || ''),
        previous_diseases: Array.isArray(data.notable_conditions)
          ? data.notable_conditions.join(', ')
          : data.notable_conditions || '',
        medications: Array.isArray(data.medications)
    ? data.medications.join(', ')
    : data.medications || ''
        
      }));

      setAutofillPreview(data);
    } catch (err) {
      console.error("Autofill error:", err);
      alert("❌ Failed to parse document content. Try editing manually.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white shadow-lg border border-gray-200 p-6 rounded-lg max-w-xl mx-auto mb-6">
      <h3 className="text-2xl font-semibold text-center mb-4 text-blue-700 flex items-center justify-center gap-2">
        <UserPlus size={20} /> Add New Patient
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Patient Name" value={formData.name} required
          className="w-full p-2 border rounded"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input type="number" placeholder="Age" value={formData.age} required
          className="w-full p-2 border rounded"
          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
        />
        <input type="text" placeholder="Contact No" value={formData.contact} required
          className="w-full p-2 border rounded"
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
        />
        <input type="date" placeholder="Date of Birth" value={formData.dob} required
          className="w-full p-2 border rounded"
          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
        />
        <input type="text" placeholder="Symptoms (comma separated)" value={formData.symptoms} required
          className="w-full p-2 border rounded"
          onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
        />
        <input type="text" placeholder="Allergies" value={formData.allergies}
          className="w-full p-2 border rounded"
          onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
        />
        <input type="text" placeholder="Previous Diseases" value={formData.previous_diseases}
          className="w-full p-2 border rounded"
          onChange={(e) => setFormData({ ...formData, previous_diseases: e.target.value })}
        />
        <input type="text" placeholder="Weight (kg)" value={formData.weight}
          className="w-full p-2 border rounded"
          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
        />
        <input type="text" placeholder="Height (cm)" value={formData.height}
          className="w-full p-2 border rounded"
          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
        />
        <input type="text" placeholder="Medications" value={formData.medications}
  className="w-full p-2 border rounded"
  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
/>

        <input type="file" accept=".pdf,.jpg,.jpeg,.png" required
          className="w-full p-2 border rounded bg-gray-50"
          onChange={(e) => setFormData({ ...formData, document: e.target.files[0] })}
        />
<label className="flex items-center space-x-2 text-sm text-gray-700 mt-2">
  <input
    type="checkbox"
    checked={formData.consent}
    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
    className="accent-blue-600"
    required
  />
  <span>I consent to adding and storing this patient's medical details.</span>
</label>

        <div className="flex justify-between items-center mt-4">
          <button type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button type="button" onClick={handleAutofill}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded" disabled={loading}>
            🔍 Autofill from Doc
          </button>
          <button onClick={onClose} type="button" className="text-red-600 hover:underline">
            Cancel
          </button>
        </div>
      </form>

      {autofillPreview && (
        <div className="mt-4 p-3 border border-gray-300 bg-gray-50 rounded text-sm">
          <p className="font-semibold mb-1 text-gray-700">🧠 LLM Extracted Info Preview:</p>
          <pre className="whitespace-pre-wrap text-xs text-gray-600">{JSON.stringify(autofillPreview, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}


// AddRecordForm and MedicalHistoryList remain unchanged

function AddRecordForm({ patient, onClose, fetchPatients }) {
  const [formData, setFormData] = useState({
    symptoms: '',
    allergies: '',
    previous_diseases: '',
    medications: '',
    weight: '',
    height: '',
    document: null
  });
  const [loading, setLoading] = useState(false);
  const [autofillPreview, setAutofillPreview] = useState(null);

  const handleAddRecord = async () => {
    if (!formData.symptoms && !formData.document) {
      alert("Please enter symptoms or upload a document.");
      return;
    }

    setLoading(true);

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "document") formDataToSend.append(key, value || '');
    });
    if (formData.document) formDataToSend.append("document", formData.document);

    await axios.post(`http://localhost:8000/patients/update/${patient.id}`, formDataToSend);

    
  

    await axios.post(`http://localhost:8000/patients/${patient.id}/records`, {
      ...formData,
      predicted_disease: disease,
      treatment_advice: aiRes.data.reply,
      precautions: "Follow AI assistant advice.",
      visit_date: new Date().toISOString()
    });

    alert("✅ Medical record added & summary updated!");
    setLoading(false);
    fetchPatients();
    onClose();
  };

  const handleAutofill = async () => {
    if (!formData.document) return alert("Please upload a document first!");

    const fd = new FormData();
    fd.append("document", formData.document);

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/patients/extract-info", fd);
      let data = res.data;

      if (data.raw_response?.includes("```")) {
        const match = data.raw_response.match(/```[\s\S]*?({[\s\S]*?})[\s\S]*?```/);
        if (match && match[1]) {
          data = JSON.parse(match[1]);
        } else throw new Error("No valid JSON in response");
      }

      setFormData((prev) => ({
        ...prev,
        symptoms: prev.symptoms,
        allergies: Array.isArray(data.allergies) ? data.allergies.join(', ') : data.allergies || '',
        previous_diseases: Array.isArray(data.notable_conditions)
          ? data.notable_conditions.join(', ')
          : data.notable_conditions || '',
        medications: Array.isArray(data.medications)
          ? data.medications.join(', ')
          : data.medications || '',
        weight: String(data.weight || ''),
        height: String(data.height || '')
      }));

      setAutofillPreview(data);
    } catch (err) {
      console.error("Autofill error:", err);
      alert("❌ Autofill failed. Try manual entry.");
    }
    setLoading(false);
  };

  return (
    <div className="mt-4 bg-white border p-4 rounded shadow-sm space-y-3">
      <textarea
        placeholder="Symptoms (comma separated)"
        className="w-full p-2 border rounded"
        value={formData.symptoms}
        onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
      />
      <input
        type="text"
        placeholder="Allergies"
        className="w-full p-2 border rounded"
        value={formData.allergies}
        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
      />
      <input
        type="text"
        placeholder="Previous Diseases"
        className="w-full p-2 border rounded"
        value={formData.previous_diseases}
        onChange={(e) => setFormData({ ...formData, previous_diseases: e.target.value })}
      />
      <input
        type="text"
        placeholder="Medications"
        className="w-full p-2 border rounded"
        value={formData.medications}
        onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
      />
      <input
        type="text"
        placeholder="Weight (kg)"
        className="w-full p-2 border rounded"
        value={formData.weight}
        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
      />
      <input
        type="text"
        placeholder="Height (cm)"
        className="w-full p-2 border rounded"
        value={formData.height}
        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
      />
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="w-full border p-2 rounded bg-gray-50"
        onChange={(e) => setFormData({ ...formData, document: e.target.files[0] })}
      />

      <div className="flex gap-3">
        <button
          onClick={handleAddRecord}
          className="bg-blue-600 text-white px-4 py-1 rounded"
          disabled={loading}
        >
          {loading ? "Processing..." : "Predict & Save"}
        </button>
        <button
          onClick={handleAutofill}
          className="bg-orange-500 text-white px-4 py-1 rounded"
          disabled={loading}
        >
          🔍 Autofill from Doc
        </button>
        <button onClick={onClose} className="text-red-600 hover:underline">Cancel</button>
      </div>

      {autofillPreview && (
        <div className="bg-gray-100 p-3 rounded text-sm mt-2">
          <p className="font-semibold text-gray-700 mb-1">🧠 LLM Extracted Info Preview:</p>
          <pre className="whitespace-pre-wrap text-gray-600">{JSON.stringify(autofillPreview, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function MedicalHistoryList({ patientId }) {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [diseaseHistory, setDiseaseHistory] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:8000/patients/${patientId}/records`)
      .then(res => setMedicalRecords(res.data));
    axios.get(`http://localhost:8000/disease-history/${patientId}`)
      .then(res => setDiseaseHistory(res.data));
  }, [patientId]);

  return (
    <div className="space-y-3">
      {medicalRecords.map((r, i) => (
        <div key={i} className="p-4 border bg-white rounded shadow-sm">
          <p className="text-sm text-gray-600 mb-1">📅 {new Date(r.visit_date).toLocaleString()}</p>
          <p><strong>Symptoms:</strong> {r.symptoms}</p>
          {diseaseHistory[i] && (
            <p><strong>Disease:</strong> {diseaseHistory[i].predicted_disease}</p>
          )}
          <p><strong>Allergies:</strong> {r.allergies || 'N/A'}</p>
          <p><strong>Previous Diseases:</strong> {r.previous_diseases || 'N/A'}</p>
          <p><strong>Medications:</strong> {r.medications || 'N/A'}</p>
          <p><strong>Weight:</strong> {r.weight ? `${r.weight} kg` : 'N/A'}</p>
          <p><strong>Height:</strong> {r.height ? `${r.height} cm` : 'N/A'}</p>
        </div>
      ))}
    </div>
  );
}
