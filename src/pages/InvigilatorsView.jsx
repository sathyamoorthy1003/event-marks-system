import React, { useState, useRef, useMemo } from "react";
import {
  addDoc,
  updateDoc,
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
  Lock,
  Unlock,
  ClipboardList,
  Trash2,
} from "lucide-react";
import { getCollectionRef, getDocRef, db } from "../lib/firebase";
import { Card, Button, Input, Modal, Pagination, SampleDataPreview, Badge } from "../components/UIComponents";

const InvigilatorsView = ({
  invigilators,
  submissions,
  rubric,
  addToast,
  currentAppId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [form, setForm] = useState({ id: "", name: "" });
  const [page, setPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const itemsPerPage = 20;

  const paginatedInvigilators = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return invigilators.slice(start, start + itemsPerPage);
  }, [invigilators, page]);

  const addJudge = async () => {
    if (!form.id) return addToast("Judge ID is required", "error");
    try {
      await addDoc(getCollectionRef(currentAppId, "invigilators"), {
        judgeId: form.id.toUpperCase(),
        name: form.name || "",
        status: "active",
      });
      await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
        action: "add_judge",
        details: { id: form.id, name: form.name },
        timestamp: serverTimestamp(),
      });
      setForm({ id: "", name: "" });
      setIsModalOpen(false);
      addToast("Judge Added", "success");
    } catch (err) {
      console.error(err);
      addToast("Error adding judge: " + err.message, "error");
    }
  };

  const toggleStatus = async (judge) => {
    const newStatus = judge.status === "active" ? "inactive" : "active";
    await updateDoc(getDocRef(currentAppId, "invigilators", judge.id), {
      status: newStatus,
    });
    await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
      action: "toggle_judge_status",
      details: { id: judge.judgeId, status: newStatus },
      timestamp: serverTimestamp(),
    });
    addToast(`Judge ${newStatus}`, "success");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
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
              judgeId: cols[0].trim().toUpperCase(),
              name: cols[1]?.trim() || "",
              status: "active",
              createdAt: serverTimestamp(),
            });
          }
        }

        for (let i = 0; i < allData.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          const chunk = allData.slice(i, i + BATCH_SIZE);
          chunk.forEach((item) => {
            const newRef = doc(getCollectionRef(currentAppId, "invigilators"));
            batch.set(newRef, item);
          });
          await batch.commit();
        }

        await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
          action: "import_judges",
          details: { count: allData.length },
          timestamp: serverTimestamp(),
        });
        addToast(`Imported ${allData.length} judges`, "success");
      } catch (err) {
        console.error(err);
        addToast("Error importing judges", "error");
      } finally {
        setIsImporting(false);
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  const downloadJudgeReport = (judge) => {
    const judgeSubs = submissions.filter(
      (s) => s.invigilatorId === judge.judgeId
    );
    if (judgeSubs.length === 0)
      return addToast("No evaluations found.", "error");
    const csv =
      "data:text/csv;charset=utf-8,Team,Code," +
      rubric.map((r) => r.name).join(",") +
      ",Total,Time\n" +
      judgeSubs
        .map((s) =>
          [
            s.teamName,
            s.teamCode,
            ...rubric.map((r) => s.scores[r.id] || 0),
            s.totalScore,
            s.timestamp?.toDate()?.toLocaleString(),
          ].join(",")
        )
        .join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `${judge.name || judge.judgeId}_evaluations.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Report Downloaded", "success");
  };

  const downloadTemplate = () => {
    const csvContent = "Judge ID,Name (Optional)\nJDG001,Dr. Smith\nJDG002,";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "invigilators_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Invigilators</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
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
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current.click()}
              icon={isImporting ? Loader2 : Upload}
              disabled={isImporting}
            >
              {isImporting ? "Importing..." : "Import CSV"}
            </Button>
          </div>
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
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInvigilators.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-blue-600">
                  {i.judgeId}
                </td>
                <td className="px-6 py-3 font-medium">{i.name || "-"}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      color={
                        i.status === "active" || !i.status ? "green" : "gray"
                      }
                    >
                      {i.status === "active" || !i.status
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                    <button
                      onClick={() => toggleStatus(i)}
                      className="text-slate-400 hover:text-blue-600"
                    >
                      {i.status === "active" || !i.status ? (
                        <Lock size={14} />
                      ) : (
                        <Unlock size={14} />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-3 text-right flex justify-end gap-2">
                  <button
                    onClick={() => downloadJudgeReport(i)}
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
                          "invigilators",
                          i.id
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
            {invigilators.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400">
                  No invigilators.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          totalItems={invigilators.length}
          itemsPerPage={itemsPerPage}
          currentPage={page}
          onPageChange={setPage}
        />
      </Card>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Invigilator"
      >
        <div className="space-y-4">
          <Input
            label="ID"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
          />
          <Input
            label="Name (Optional)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={addJudge}>Add</Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="CSV Template Preview"
      >
        <SampleDataPreview
          type="invigilator"
          onClose={() => setIsPreviewOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default InvigilatorsView;
