import React, { useState, useMemo } from "react";
import { Users, UserCheck, FileSpreadsheet, Award } from "lucide-react";
import { Card, Badge, Pagination } from "../components/UIComponents";

const DashboardView = ({
  teams,
  invigilators,
  submissions,
  leaderboard,
  rankingConfig,
}) => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const stats = [
    {
      label: "Total Participants",
      value: teams.length,
      icon: Users,
      color: "blue",
    },
    {
      label: "Total Invigilators",
      value: invigilators.length,
      icon: UserCheck,
      color: "green",
    },
    {
      label: "Total Submissions",
      value: submissions.length,
      icon: FileSpreadsheet,
      color: "purple",
    },
    { label: "Active Round", value: "Finals", icon: Award, color: "orange" },
  ];
  const paginatedLeaderboard = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return leaderboard.slice(start, start + itemsPerPage);
  }, [leaderboard, page]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500">
          Real-time event overview and leaderboard.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="p-6 flex items-start justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                stat.color === "blue"
                  ? "bg-blue-50 text-blue-600"
                  : stat.color === "green"
                  ? "bg-emerald-50 text-emerald-600"
                  : stat.color === "purple"
                  ? "bg-purple-50 text-purple-600"
                  : "bg-orange-50 text-orange-600"
              }`}
            >
              <stat.icon size={24} />
            </div>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Top 10 Leaderboard
            </h3>
            <p className="text-sm text-slate-500">
              Ranking Method:{" "}
              <span className="font-semibold text-blue-600">
                {rankingConfig?.method === "bayesian"
                  ? "Bayesian Weighted"
                  : "Simple Sum"}
              </span>
            </p>
          </div>
          <Badge color="green">Live Updates On</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-medium">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 text-right">Evaluations</th>
                <th className="px-6 py-4 text-right">Raw Score</th>
                <th className="px-6 py-4 text-right">Weighted Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Waiting for submissions...
                  </td>
                </tr>
              ) : (
                paginatedLeaderboard.map((team, index) => {
                  const actualRank = (page - 1) * itemsPerPage + index + 1;
                  return (
                    <tr
                      key={team.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        {actualRank === 1 ? (
                          <span className="text-xl">🥇</span>
                        ) : actualRank === 2 ? (
                          <span className="text-xl">🥈</span>
                        ) : actualRank === 3 ? (
                          <span className="text-xl">🥉</span>
                        ) : (
                          <span className="font-mono text-slate-400">
                            #{actualRank}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {team.teamCode}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {team.teamName}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500">
                        {team.count}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400 font-mono">
                        {team.total?.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600 text-lg">
                        {team.finalScore?.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          totalItems={leaderboard.length}
          itemsPerPage={itemsPerPage}
          currentPage={page}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
};

export default DashboardView;
