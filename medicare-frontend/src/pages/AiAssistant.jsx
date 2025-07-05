import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bot, Send, ScanSearch, User, Save } from "lucide-react";

export default function AiAssistant() {
  const [patient, setPatient] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [predictedDisease, setPredictedDisease] = useState(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [treatment, setTreatment] = useState("");
  const [medication, setMedication] = useState("");
  const [tests, setTests] = useState("");
  const [precaution, setPrecaution] = useState("");
  const [treatmentList, setTreatmentList] = useState([]);
  const [editingPlanId, setEditingPlanId] = useState(null); // null means add mode

  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("selectedPatient");
    if (saved) {
      const parsed = JSON.parse(saved);
      setPatient(parsed);
      fetchTreatmentPlans(parsed.id);
    } else {
      navigate("/dashboard");
    }
  }, []);

  const detectDisease = async () => {
    try {
      const symptomsArray = (patient?.symptoms || "")
        .split(",")
        .map((s) => s.trim());

      const res = await axios.post(
        `http://localhost:8000/ai/predict?patient_id=${patient?.id}`,
        { symptoms: symptomsArray }
      );

      setPredictedDisease(res.data.predicted_disease);
      setShowSaveButton(res.data.stored === true);
    } catch (err) {
      console.error("Prediction failed:", err.response?.data || err.message);
      alert("Failed to predict disease. Please check patient symptoms.");
    }
  };

  const fetchLLMSuggestions = async () => {
    try {
      const res = await axios.post("http://localhost:8000/ai/chat", {
        messages: [
          {
            role: "system",
            content: `Return ONLY a pure JSON object with: treatment, medications, tests, precautions for "${predictedDisease}". No explanation, no markdown. Format:
{
  "treatment": "...",
  "medications": "...",
  "tests": "...",
  "precautions": "..."
}`
          }
        ]
      });

      const reply = res.data.reply;
      const jsonStart = reply.indexOf("{");
      const jsonEnd = reply.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = reply.slice(jsonStart, jsonEnd + 1);
        const data = JSON.parse(jsonString);
        setTreatment(data.treatment || "");
        setMedication(data.medications || "");
        setTests(data.tests || "");
        setPrecaution(data.precautions || "");
      } else {
        throw new Error("JSON not found in response");
      }
    } catch (err) {
      console.error("LLM autofill failed:", err);
      alert("LLM response was not in the expected JSON format.");
    }
  };
const saveTreatmentPlan = async () => {
  try {
    if (editingPlanId) {
      await axios.put(
        `http://localhost:8000/ai/treatment-plan/${editingPlanId}/update`,
        { treatment, medication, tests, precaution }
      );
      alert("🔁 Treatment plan updated.");
      setEditingPlanId(null); // Reset to add mode
    } else {
      await axios.post(
        `http://localhost:8000/ai/treatment-plan/${patient.id}/add`,
        { treatment, medication, tests, precaution }
      );
      alert("✅ Treatment plan saved.");
    }

    setTreatment("");
    setMedication("");
    setTests("");
    setPrecaution("");
    setEditingPlanId(null); 
    fetchTreatmentPlans();
  } catch (err) {
    console.error("Save/Update failed:", err);
    alert("❌ Failed to save/update treatment plan.");
  }
};


  const fetchTreatmentPlans = async (id = patient?.id) => {
    if (!id) return;
    try {
      const res = await axios.get(`http://localhost:8000/ai/treatment-plan/${id}/list`);
      setTreatmentList(res.data);
    } catch (err) {
      console.error("Fetching treatment plans failed:", err);
    }
  };

  const saveDiseaseRecord = () => {
    alert("Disease prediction already stored in database.");
    setShowSaveButton(false);
  };

  const askAssistant = async () => {
    try {
      const systemMessage = {
        role: "system",
        content: `You are an AI medical assistant. Here's the patient info: 
        Name: ${patient?.name}
        Age: ${patient?.age}
        Contact: ${patient?.contact}
        Symptoms: ${patient?.symptoms}
        ${predictedDisease ? `Predicted Disease: ${predictedDisease}` : ""}
        Provide diagnosis guidance, precautions, and treatment if asked.`
      };

      const res = await axios.post("http://localhost:8000/ai/chat", {
        messages: [
          systemMessage,
          ...chatHistory.map((c) => ({
            role: c.sender === "you" ? "user" : "assistant",
            content: c.text
          })),
          { role: "user", content: chatInput }
        ]
      });

      setChatHistory([
        ...chatHistory,
        { sender: "you", text: chatInput },
        { sender: "ai", text: res.data.reply }
      ]);
      setChatInput("");
    } catch (err) {
      console.error("Chat failed:", err);
      alert("Failed to get AI response.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 text-blue-700 mb-4">
        <h2 className="text-3xl font-bold">AI Assistant for {patient?.name}</h2>
      </div>

      <div className="bg-white border rounded-xl shadow p-5 space-y-2">
        <div className="text-sm text-gray-600">
          <User size={16} className="inline-block mr-1" />
          <strong>Age:</strong> {patient?.age}, <strong>Contact:</strong> {patient?.contact}
        </div>
        <p className="text-gray-700">
          <strong>Symptoms:</strong> {patient?.symptoms}
        </p>

        <button
          onClick={detectDisease}
          className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <ScanSearch size={18} />
          Detect Disease
        </button>

        {predictedDisease || editingPlanId ? (
  <div className="mt-6 space-y-3">
    <h3 className="text-lg font-semibold text-gray-700">
      {editingPlanId
        ? "🔁 Update Existing Treatment Plan"
        : `📝 Treatment Plan for ${predictedDisease}`}
    </h3>

    <textarea
      className="w-full p-2 border rounded"
      placeholder="Treatment Plan..."
      value={treatment}
      onChange={(e) => setTreatment(e.target.value)}
    />
    <textarea
      className="w-full p-2 border rounded"
      placeholder="Medications..."
      value={medication}
      onChange={(e) => setMedication(e.target.value)}
    />
    <textarea
      className="w-full p-2 border rounded"
      placeholder="Tests to be done..."
      value={tests}
      onChange={(e) => setTests(e.target.value)}
    />
    <textarea
      className="w-full p-2 border rounded"
      placeholder="Precautions..."
      value={precaution}
      onChange={(e) => setPrecaution(e.target.value)}
    />

    <div className="flex gap-3">
      <button
        onClick={fetchLLMSuggestions}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
      >
        🧠 Autofill from LLM
      </button>
      <button
        onClick={saveTreatmentPlan}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        💾 {editingPlanId ? "Update Plan" : "Save Plan"}
      </button>
      {editingPlanId && (
        <button
          onClick={() => {
            setTreatment("");
            setMedication("");
            setTests("");
            setPrecaution("");
            setEditingPlanId(null);
          }}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          ❌ Cancel Edit
        </button>
      )}
    </div>
  </div>
) : null}


      <div className="mt-6">
  <h3 className="text-lg font-semibold text-gray-700 mb-2">📚 Saved Treatment Records</h3>
  <div className="space-y-4">
    {treatmentList.map((plan, index) => (
      <div key={index} className="border rounded-xl p-4 shadow bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-indigo-700">
            {index + 1}ᵗʰ Treatment Plan
          </h4>
          <div className="flex gap-2">
            <button
  className="text-sm text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded"
  onClick={() => {
    setEditingPlanId(plan.id);
    setTreatment(plan.treatment);
    setMedication(plan.medication);
    setTests(plan.tests);
    setPrecaution(plan.precaution);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top form
  }}
>
  ✏️ Edit
</button>

<button
  className="text-sm text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
  onClick={async () => {
    if (confirm("Are you sure you want to delete this plan?")) {
      await axios.delete(`http://localhost:8000/ai/treatment-plan/${plan.id}/delete`);
      fetchTreatmentPlans(); // Refresh list
    }
  }}
>
  🗑 Delete
</button>

          </div>
        </div>

        <details className="mb-2">
          <summary className="font-semibold text-purple-700 cursor-pointer hover:underline">
             Treatment
          </summary>
          <p className="mt-1 text-gray-800 text-sm">{plan.treatment}</p>
        </details>
        <details className="mb-2">
          <summary className="font-semibold text-blue-700 cursor-pointer hover:underline">
             Medications
          </summary>
          <p className="mt-1 text-gray-800 text-sm">{plan.medication}</p>
        </details>
        <details className="mb-2">
          <summary className="font-semibold text-green-700 cursor-pointer hover:underline">
             Tests
          </summary>
          <p className="mt-1 text-gray-800 text-sm">{plan.tests}</p>
        </details>
        <details>
          <summary className="font-semibold text-red-700 cursor-pointer hover:underline">
             Precautions
          </summary>
          <p className="mt-1 text-gray-800 text-sm">{plan.precaution}</p>
        </details>
      </div>
    ))}
  </div>
</div>


        {showSaveButton && (
          <button
            onClick={saveDiseaseRecord}
            className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Save size={18} />
            Save Disease Record
          </button>
        )}
      </div>

      <div className="mt-8 bg-white border rounded-xl shadow-lg p-5">
        <h3 className="font-bold text-xl text-blue-700 mb-4 flex items-center gap-2">
          <Bot size={22} />
          AI Medical Assistant
        </h3>

        {chatHistory.length === 0 && patient && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-4 text-blue-900">
            👋 Hello I am <strong>{patient.name}</strong>'s AI Medical Assistant! I can help interpret symptoms,
            suggest possible diseases, and answer any health-related questions.
          </div>
        )}

        <div className="space-y-3 h-64 overflow-y-auto px-2">
          {chatHistory.map((c, i) => (
            <div key={i} className={`flex ${c.sender === "you" ? "justify-end" : "justify-start"}`}>
              <div
                className={`px-4 py-2 max-w-[75%] rounded-2xl shadow text-sm ${
                  c.sender === "you"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {c.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask something about this patient..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
            onClick={askAssistant}
          >
            <Send size={16} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
