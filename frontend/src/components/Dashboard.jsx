import { motion } from "framer-motion";

export default function Dashboard({ leads }) {
  // Calculate Stats
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "New").length;
  const totalNotes = leads.reduce(
    (acc, lead) => acc + (lead.notes?.length || 0),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 p-8"
    >
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Leads"
          value={totalLeads}
          color="text-gray-800"
        />
        <StatCard
          title="Active Pipeline"
          value={newLeads}
          color="text-indigo-600"
        />
        <StatCard
          title="Total Interactions"
          value={totalNotes}
          color="text-purple-600"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-4">Recent System Activity</h3>
        <div className="space-y-4">
          {leads.slice(0, 5).map((lead) => (
            <div
              key={lead.id}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {lead.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  New Lead: {lead.name}
                </p>
                <p className="text-xs text-gray-500">Status: {lead.status}</p>
              </div>
            </div>
          ))}
          {leads.length === 0 && (
            <p className="text-gray-400">No recent activity.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Helper Component
function StatCard({ title, value, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <p className="text-gray-400 text-sm font-medium uppercase">{title}</p>
      <h3 className={`text-4xl font-bold mt-2 ${color}`}>{value}</h3>
    </div>
  );
}
