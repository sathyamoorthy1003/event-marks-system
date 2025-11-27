import React from "react";
import { UserCheck, Users, FileText, ListOrdered } from "lucide-react";
import { Card, Button } from "../components/UIComponents";

const ExportView = ({
  submissions,
  rubric,
  teams,
  invigilators,
  leaderboard,
}) => {
  const downloadCSV = (content, filename) => {
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const exportJudgeData = () => {
    const headers = ["Judge ID", "Name", "Status"];
    const rows = invigilators.map((i) => [
      i.judgeId,
      i.name,
      i.status || "active",
    ]);
    downloadCSV(
      "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n"),
      "judges_datasheet.csv"
    );
  };
  const exportTeamData = () => {
    const headers = ["Team ID", "Team Name"];
    const rows = teams.map((t) => [t.code, t.name]);
    downloadCSV(
      "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n"),
      "teams_datasheet.csv"
    );
  };
  const exportOverallData = () => {
    const criteriaHeaders = rubric.map((r) => r.name);
    const headers = [
      "Submission ID",
      "Team Code",
      "Team Name",
      "Invigilator ID",
      ...criteriaHeaders,
      "Total Score",
      "Timestamp",
    ];
    const rows = submissions.map((sub) => [
      sub.id,
      sub.teamCode,
      sub.teamName,
      sub.invigilatorId,
      ...rubric.map((r) => sub.scores[r.id] || 0),
      sub.totalScore,
      sub.timestamp?.toDate()?.toLocaleString(),
    ]);
    downloadCSV(
      "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n"),
      "master_score_sheet.csv"
    );
  };

  // New: Export Rank List
  const exportRankList = () => {
    const headers = [
      "Rank",
      "Team Code",
      "Team Name",
      "Evaluations Count",
      "Raw Total Score",
      "Final Weighted Score",
    ];
    const rows = leaderboard.map((team, index) => [
      index + 1,
      team.teamCode,
      team.teamName,
      team.count,
      team.total?.toFixed(2),
      team.finalScore?.toFixed(2),
    ]);
    downloadCSV(
      "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n"),
      "rank_list.csv"
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Export Data</h2>
        <p className="text-slate-500">
          Download specific datasets or full reports.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-t-4 border-t-purple-500 hover:shadow-lg transition-shadow">
          <div className="mb-4 p-3 bg-purple-100 text-purple-600 rounded-lg w-fit">
            <UserCheck size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Judge Data</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            List of all registered invigilators.
          </p>
          <Button
            variant="secondary"
            onClick={exportJudgeData}
            className="w-full"
          >
            Download CSV
          </Button>
        </Card>
        <Card className="p-6 border-t-4 border-t-blue-500 hover:shadow-lg transition-shadow">
          <div className="mb-4 p-3 bg-blue-100 text-blue-600 rounded-lg w-fit">
            <Users size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Team Data</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            List of participating teams.
          </p>
          <Button
            variant="secondary"
            onClick={exportTeamData}
            className="w-full"
          >
            Download CSV
          </Button>
        </Card>
        <Card className="p-6 border-t-4 border-t-emerald-500 hover:shadow-lg transition-shadow">
          <div className="mb-4 p-3 bg-emerald-100 text-emerald-600 rounded-lg w-fit">
            <FileText size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Score Sheet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Detailed score records.
          </p>
          <Button onClick={exportOverallData} className="w-full">
            Download CSV
          </Button>
        </Card>
        <Card className="p-6 border-t-4 border-t-orange-500 hover:shadow-lg transition-shadow">
          <div className="mb-4 p-3 bg-orange-100 text-orange-600 rounded-lg w-fit">
            <ListOrdered size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Rank List</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Leaderboard sorted by rank.
          </p>
          <Button onClick={exportRankList} className="w-full">
            Download CSV
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default ExportView;
