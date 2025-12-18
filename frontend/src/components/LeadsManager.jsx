import { useState } from "react";
import {
  Search,
  Plus,
  Send,
  ChevronRight,
  Trash2,
  AlertTriangle,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function LeadsManager({
  leads,
  onLeadAdded,
  onNoteAdded,
  onLeadDeleted,
  apiUrl,
  customFields = [],
}) {
  const safeCustomFields = Array.isArray(customFields) ? customFields : [];
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State: Handles both standard fields (name/email) AND dynamic custom data
  const [form, setForm] = useState({ name: "", email: "", customData: {} });

  const [noteText, setNoteText] = useState("");

  // Delete UI State
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HANDLERS ---

  // 1. Handle Input for Standard Fields
  const handleStandardInput = (e, field) => {
    setForm({ ...form, [field]: e.target.value });
  };

  // 2. Handle Input for Dynamic Custom Fields
  const handleCustomInput = (label, value) => {
    setForm((prev) => ({
      ...prev,
      customData: {
        ...prev.customData,
        [label]: value,
      },
    }));
  };

  // 3. Add New Lead
  const handleAddLead = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Flatten data: { name, email, "Property Type": "Apt", "Budget": "500k" }
    const payload = {
      name: form.name,
      email: form.email,
      ...form.customData,
    };

    try {
      await axios.post(apiUrl, payload);
      setForm({ name: "", email: "", customData: {} }); // Reset Form
      onLeadAdded(); // Refresh Parent Data
    } catch (error) {
      console.error("Error adding lead", error);
      alert("Failed to add lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Add Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedLead || !noteText.trim()) return;

    const newNote = { content: noteText, createdAt: new Date().toISOString() };

    // Optimistic UI Update
    const updatedLead = {
      ...selectedLead,
      notes: [...(selectedLead.notes || []), newNote],
    };
    setSelectedLead(updatedLead);
    setNoteText("");

    await axios.post(`${apiUrl}/${selectedLead.id}/notes`, {
      content: newNote.content,
    });
    onNoteAdded();
  };

  // 5. Delete Logic
  const confirmDelete = (e, lead) => {
    e.stopPropagation();
    setLeadToDelete(lead);
  };

  const executeDelete = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${apiUrl}/${leadToDelete.id}`);
      if (selectedLead?.id === leadToDelete.id) setSelectedLead(null);
      onLeadDeleted();
      setLeadToDelete(null);
    } catch (error) {
      alert("Failed to delete lead");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredLeads = leads.filter((lead) =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full gap-6 p-6 relative">
      {/* --- LEFT COLUMN: LIST & FORM --- */}
      <div className="w-1/3 min-w-[320px] bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {/* Search & Add Form Container */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Dynamic Add Lead Form */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wide">
              Quick Add New Lead
            </h3>
            <form onSubmit={handleAddLead} className="space-y-2">
              <div className="flex flex-col gap-2">
                <input
                  className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => handleStandardInput(e, "name")}
                  required
                />
                <input
                  className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => handleStandardInput(e, "email")}
                  required
                />
              </div>

              {/* Render Custom Fields dynamically */}
              {safeCustomFields.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  {safeCustomFields.map((field, idx) => (
                    <input
                      key={idx}
                      type={field.type || "text"}
                      className="p-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:border-indigo-500 outline-none"
                      placeholder={field.label}
                      value={form.customData[field.label] || ""}
                      onChange={(e) =>
                        handleCustomInput(field.label, e.target.value)
                      }
                    />
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-indigo-600 text-white p-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Add Lead
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Lead List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`group p-3 rounded-xl cursor-pointer mb-2 transition flex justify-between items-center ${
                selectedLead?.id === lead.id
                  ? "bg-indigo-50 border border-indigo-200 shadow-sm"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div className="overflow-hidden">
                <h4
                  className={`font-semibold text-sm truncate ${
                    selectedLead?.id === lead.id
                      ? "text-indigo-700"
                      : "text-gray-800"
                  }`}
                >
                  {lead.name}
                </h4>
                <p className="text-xs text-gray-500 truncate">{lead.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => confirmDelete(e, lead)}
                  className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {selectedLead?.id === lead.id && (
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                )}
              </div>
            </div>
          ))}
          {filteredLeads.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-10">
              No leads found.
            </p>
          )}
        </div>
      </div>

      {/* --- RIGHT COLUMN: DETAILS & HISTORY --- */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col relative overflow-hidden">
        {selectedLead ? (
          <>
            {/* Lead Header */}
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedLead.name}
                  </h1>
                  <p className="text-gray-500">{selectedLead.email}</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-green-200">
                {selectedLead.status}
              </span>
            </div>

            {/* Dynamic Fields Grid Display */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-5 rounded-xl border border-gray-100">
              {safeCustomFields.map((field) => (
                <div key={field.label}>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">
                    {field.label}
                  </span>
                  <p className="font-medium text-gray-800 text-sm">
                    {selectedLead[field.label] || (
                      <span className="text-gray-300 italic">--</span>
                    )}
                  </p>
                </div>
              ))}
              {safeCustomFields.length === 0 && (
                <p className="text-gray-400 text-xs italic col-span-3">
                  No custom fields configured.
                </p>
              )}
            </div>

            {/* Activity / Notes History */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>{" "}
                Interaction History
              </h3>

              {selectedLead.notes && selectedLead.notes.length > 0 ? (
                selectedLead.notes.map((note, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-gray-300 group-hover:bg-indigo-500 transition rounded-full mt-2"></div>
                      <div className="w-0.5 bg-gray-100 flex-1 h-full min-h-[20px]"></div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl rounded-tl-none border border-gray-100 flex-1 group-hover:shadow-md transition-all">
                      <p className="text-gray-800 text-sm leading-relaxed">
                        {note.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-2 text-right">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-sm">
                    No notes yet. Start the conversation!
                  </p>
                </div>
              )}
            </div>

            {/* Add Note Input */}
            <form onSubmit={handleAddNote} className="relative mt-auto">
              <input
                className="w-full p-4 pr-14 bg-white border border-gray-200 shadow-sm rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="Log a call, meeting, or email..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <User className="w-20 h-20 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a lead to view details</p>
          </div>
        )}
      </div>

      {/* --- CONFIRMATION BAR --- */}
      <AnimatePresence>
        {leadToDelete && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-8 z-50 border border-gray-700 min-w-[350px]"
            style={{ translateX: "-50%" }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <span className="block font-bold text-sm">Delete Lead?</span>
                <span className="text-xs text-gray-400">
                  Permanently remove {leadToDelete.name}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setLeadToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-lg"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
