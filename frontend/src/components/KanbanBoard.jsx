import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { MoreHorizontal, Plus } from "lucide-react";
import axios from "axios";

// The columns we want to show
const COLUMNS = {
  New: { id: "New", color: "bg-blue-500" },
  Contacted: { id: "Contacted", color: "bg-purple-500" },
  Qualified: { id: "Qualified", color: "bg-yellow-500" },
  Lost: { id: "Lost", color: "bg-red-500" },
  Closed: { id: "Closed", color: "bg-green-500" },
};

export default function KanbanBoard({ leads, onLeadUpdated, apiUrl }) {
  const [boardData, setBoardData] = useState(leads);

  // Sync local state when leads prop changes (e.g. after a fetch)
  useEffect(() => {
    setBoardData(leads);
  }, [leads]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // 1. Dropped outside or in same place? Do nothing.
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // 2. Optimistic UI Update (Update screen BEFORE server responds)
    const newStatus = destination.droppableId;

    const updatedLeads = boardData.map((lead) => {
      if (lead.id === draggableId) {
        return { ...lead, status: newStatus };
      }
      return lead;
    });

    setBoardData(updatedLeads);

    // 3. Send to Backend
    try {
      await axios.put(`${apiUrl}/${draggableId}`, { status: newStatus });
      // Notify parent to refetch data to be safe
      onLeadUpdated();
    } catch (error) {
      console.error("Failed to update status", error);
      // Revert change if server fails (optional but recommended)
      setBoardData(leads);
      alert("Failed to move lead. Please try again.");
    }
  };

  // Helper to filter leads by column
  const getLeadsByStatus = (status) => {
    return boardData.filter((lead) => lead.status === status);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2 sm:gap-0">
        <h1 className="text-2xl font-bold text-gray-800">Pipeline Board</h1>
        <div className="text-sm text-gray-500">Drag cards to update status</div>
      </div>

      {/* DRAG DROP CONTEXT */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {Object.entries(COLUMNS).map(([columnId, config]) => (
            /* --- COLUMN --- */
            <div
              key={columnId}
              className="flex flex-col w-80 min-w-[320px] bg-gray-100/50 rounded-xl border border-gray-200 h-full max-h-full"
            >
              {/* Column Header */}
              <div className="p-3 flex items-center justify-between border-b border-gray-200/50">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                  <h2 className="font-bold text-gray-700 text-sm">
                    {columnId}
                  </h2>
                  <span className="bg-white text-gray-500 px-2 py-0.5 rounded-full text-xs font-medium shadow-sm border border-gray-100">
                    {getLeadsByStatus(columnId).length}
                  </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 p-2 overflow-y-auto transition-colors ${
                      snapshot.isDraggingOver ? "bg-indigo-50/50" : ""
                    }`}
                  >
                    {getLeadsByStatus(columnId).map((lead, index) => (
                      /* --- CARD --- */
                      <Draggable
                        key={lead.id}
                        draggableId={lead.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 group hover:shadow-md transition ${
                              snapshot.isDragging
                                ? "rotate-2 shadow-xl ring-2 ring-indigo-500 ring-opacity-50 z-50"
                                : ""
                            }`}
                            style={{ ...provided.draggableProps.style }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-gray-800 text-sm truncate pr-2">
                                {lead.name}
                              </h3>
                              {lead.value && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                  ${lead.value?.toLocaleString()}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-500 mb-3 truncate">
                              {lead.email}
                            </p>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                              <div className="text-[10px] text-gray-400 font-medium">
                                {new Date(lead.createdAt).toLocaleDateString()}
                              </div>
                              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                {lead.name.charAt(0)}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
