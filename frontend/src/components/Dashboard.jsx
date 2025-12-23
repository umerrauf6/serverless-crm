import { Users, DollarSign, TrendingUp, BarChart3 } from "lucide-react";

// ✅ Add "leads = []" in the props to set a default value
export default function Dashboard({ leads = [] }) {
  // ✅ Safety Check: If leads is not an array, force it to be empty
  const safeLeads = Array.isArray(leads) ? leads : [];

  // Calculate stats using safeLeads
  const totalLeads = safeLeads.length;
  const newLeads = safeLeads.filter((l) => l.status === "New").length;

  // Calculate Value (safely handle missing values)
  const totalValue = safeLeads.reduce((sum, lead) => {
    return sum + (Number(lead.value) || 0);
  }, 0);

  const conversionRate =
    totalLeads > 0
      ? Math.round(
          (safeLeads.filter((l) => l.status === "Closed").length / totalLeads) *
            100
        )
      : 0;

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Dashboard Overview
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          icon={<Users className="w-8 h-8 text-blue-600" />}
          label="Total Leads"
          value={totalLeads}
          color="bg-blue-50"
        />
        <StatCard
          icon={<DollarSign className="w-8 h-8 text-emerald-600" />}
          label="Pipeline Value"
          value={`$${totalValue.toLocaleString()}`}
          color="bg-emerald-50"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
          label="New Leads"
          value={newLeads}
          color="bg-purple-50"
        />
        <StatCard
          icon={<BarChart3 className="w-8 h-8 text-amber-600" />}
          label="Conversion Rate"
          value={`${conversionRate}%`}
          color="bg-amber-50"
        />
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-700">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-4">Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Value</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {safeLeads.slice(0, 5).map((lead, i) => (
                <tr key={lead.id || i} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-800">{lead.name}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold 
                      ${
                        lead.status === "New"
                          ? "bg-blue-100 text-blue-700"
                          : lead.status === "Closed"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {lead.value
                      ? `$${Number(lead.value).toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="p-4 text-gray-400">
                    {lead.createdAt
                      ? new Date(lead.createdAt).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
              {safeLeads.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-400">
                    No leads found. Add some data to see stats!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper Component
function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 transition hover:shadow-md">
      <div className={`p-4 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );
}
