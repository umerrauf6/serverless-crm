import { useState } from "react";
import axios from "axios";
import { Save, Plus, Trash2, Database, AlertTriangle } from "lucide-react";

export default function Settings({
  customFields,
  setCustomFields,
  apiUrl,
  onSave,
}) {
  // Local state for the form (so we don't change global state until saved)
  const [fields, setFields] = useState(customFields || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // --- FIELD MANAGERS ---
  const addField = () => {
    setFields([...fields, { label: "", type: "text" }]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  // --- API ACTIONS ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // POST /settings/fields
      await axios.post(`${apiUrl}/settings/fields`, fields);

      // Update Parent State
      setCustomFields(fields);
      if (onSave) onSave(); // Show Success Toast
    } catch (error) {
      console.error("Failed to save settings", error);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // --- NEW: INJECT FAKE DATA ---
  const handleSeedData = async () => {
    if (
      !window.confirm(
        "This will add random leads and users to your account. Continue?"
      )
    )
      return;

    setIsSeeding(true);
    try {
      await axios.post(`${apiUrl}/seed`);
      alert("Success! Check your Leads and Team tabs.");
    } catch (error) {
      console.error(error);
      alert("Failed to seed data.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        System Configuration
      </h1>
      <p className="text-gray-500 mb-8">
        Customize your CRM to fit your business needs.
      </p>

      {/* --- CUSTOM FIELDS SECTION --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-700">
            Lead Custom Fields
          </h2>
          <button
            onClick={addField}
            className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:bg-indigo-50 px-3 py-1 rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> Add Field
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="flex gap-4 items-center">
              <input
                className="flex-1 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Field Label (e.g. Budget)"
                value={field.label}
                onChange={(e) => updateField(index, "label", e.target.value)}
              />
              <select
                className="p-3 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none"
                value={field.type}
                onChange={(e) => updateField(index, "type", e.target.value)}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
              </select>
              <button
                onClick={() => removeField(index)}
                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-gray-400 text-sm italic text-center py-4">
              No custom fields added yet.
            </p>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition flex items-center gap-2 shadow-lg"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Configuration
              </>
            )}
          </button>
        </div>
      </div>

      {/* --- NEW: DEVELOPER ZONE --- */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 border-dashed">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Developer Zone</h2>
            <p className="text-xs text-gray-500">
              Tools for testing and debugging.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <p className="font-bold text-gray-700 text-sm">
              Populate Fake Data
            </p>
            <p className="text-xs text-gray-400">
              Adds 5 Leads and 2 Team Members to this account.
            </p>
          </div>
          <button
            onClick={handleSeedData}
            disabled={isSeeding}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition shadow-sm"
          >
            {isSeeding ? "Generating..." : "Inject Data"}
          </button>
        </div>
      </div>
    </div>
  );
}
