import React, { useState, useRef, useMemo } from "react";
import {
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  Eye,
  FileDown,
  Loader2,
  Upload,
  Plus,
  ClipboardList,
  Trash2,
} from "lucide-react";
import { getCollectionRef, db } from "../lib/firebase";
import { Card, Button, Input, Modal, Pagination, SampleDataPreview } from "../components/UIComponents";

const ParticipantsView = ({
  teams,
  submissions,
  rubric,
  addToast,
  currentAppId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamCode, setNewTeamCode] = useState("");
  const [page, setPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const itemsPerPage = 20;

  const paginatedTeams = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return teams.slice(start, start + itemsPerPage);
  }, [teams, page]);

  const addParticipant = async () => {
    if (!newTeamName || !newTeamCode)
      return addToast("Fill all fields.", "error");
    if (teams.some((t) => t.code === newTeamCode))
      return addToast("ID exists.", "error");
    try {
      await addDoc(getCollectionRef(currentAppId, "teams"), {
        name: newTeamName,
        code: newTeamCode,
        createdAt: serverTimestamp(),
      });
      await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
        action: "add_participant",
        details: { name: newTeamName, code: newTeamCode },
        timestamp: serverTimestamp(),
      });
      setNewTeamName("");
      setNewTeamCode("");
      setIsModalOpen(false);
      addToast("Participant Added", "success");
    } catch (err) {
      console.error(err);
      addToast("Error adding participant: " + err.message, "error");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text
        .split(/\r\n|\n/)
        .map((row) => row.trim())
        .filter((r) => r);
      const BATCH_SIZE = 450;
      const allData = [];

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",");
        if (cols[0]) {
          allData.push({
            name: cols[0].trim(),
            code:
              cols[1]?.trim() ||
              `TM-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            createdAt: serverTimestamp(),
          });
        }
      }

      for (let i = 0; i < allData.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = allData.slice(i, i + BATCH_SIZE);
        chunk.forEach((item) => {
          const newRef = doc(getCollectionRef(currentAppId, "teams"));
          batch.set(newRef, item);
        });
        await batch.commit();
      }

      await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
        action: "import_participants",
        details: { count: allData.length },
        timestamp: serverTimestamp(),
      });
      addToast(`Imported ${allData.length} participants`, "success");
    };
    reader.readAsText(file);
  };

  const downloadParticipantReport = (team) => {
    const teamSubs = submissions.filter((s) => s.teamId === team.id);
    if (teamSubs.length === 0)
      return addToast("No evaluations found.", "error");
    const csv =
      "data:text/csv;charset=utf-8,Judge," +
      rubric.map((r) => r.name).join(",") +
      ",Total,Time\n" +
      teamSubs
        .map((s) =>
          [
            s.invigilatorId,
            ...rubric.map((r) => s.scores[r.id] || 0),
            s.totalScore,
            s.timestamp?.toDate()?.toLocaleString(),
          ].join(",")
        )
        .join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `${team.name}_report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Report Downloaded", "success");
  };

  const downloadTemplate = () => {
    const csvContent =
      "Team Name,Team Code (Mandatory)\nTeam Alpha,TM-001\nTeam Beta,TM-002";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "participants_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Participants</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileUpload}
          />
          <Button
            variant="secondary"
            onClick={() => setIsPreviewOpen(true)}
            icon={Eye}
          >
            Preview Format
          </Button>
          <Button
            variant="secondary"
            onClick={downloadTemplate}
            icon={FileDown}
          >
            Template
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current.click()}
            icon={isImporting ? Loader2 : Upload}
            disabled={isImporting}
          >
            {isImporting ? "Importing..." : "Import CSV"}
          </Button>
          <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
            Add Manually
          </Button>
        </div>
      </div>
      <Card>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTeams.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-blue-600">{t.code}</td>
                <td className="px-6 py-3 font-bold">{t.name}</td>
                <td className="px-6 py-3 text-right flex justify-end gap-2">
                  <button
                    onClick={() => downloadParticipantReport(t)}
                    className="text-blue-600"
                  >
                    <ClipboardList size={16} />
                  </button>
                  <button
                    onClick={() =>
                      deleteDoc(
                        doc(
                          db,
                          "artifacts",
                          currentAppId,
                          "public",
                          "data",
                          "teams",
                          t.id
                        )
                      )
                    }
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr>
                <td colSpan="3" className="p-8 text-center text-slate-400">
                  No participants.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          totalItems={teams.length}
          itemsPerPage={itemsPerPage}
          currentPage={page}
          onPageChange={setPage}
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Participant"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
          <Input
            label="ID"
            value={newTeamCode}
            onChange={(e) => setNewTeamCode(e.target.value.toUpperCase())}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={addParticipant}>Add</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="CSV Template Preview"
      >
        <SampleDataPreview
          type="participant"
          onClose={() => setIsPreviewOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ParticipantsView;
