import React, { useState, useEffect, useMemo } from "react";
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { Activity } from "lucide-react";
import {
  auth,
  getCollectionRef,
  getDocRef,
  DEFAULT_APP_ID,
  formatDate,
} from "./lib/firebase";
import { Card, ToastContainer } from "./components/UIComponents";
import Sidebar from "./components/Sidebar";

// Pages
import ParticipantsView from "./pages/ParticipantsView";
import LoginView from "./pages/LoginView";
import DashboardView from "./pages/DashboardView";
import RankingLogicView from "./pages/RankingLogicView";
import QRCodeManager from "./pages/QRCodeManager";
import JudgeApp from "./pages/JudgeApp";
import InvigilatorsView from "./pages/InvigilatorsView";
import SettingsView from "./pages/SettingsView";
import ExportView from "./pages/ExportView";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [activeAppId, setActiveAppId] = useState(DEFAULT_APP_ID);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [teams, setTeams] = useState([]);
  const [invigilators, setInvigilators] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [rubric, setRubric] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [rankingConfig, setRankingConfig] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000
    );
  };

  useEffect(() => {
    const init = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token)
        await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    };
    init();
    onAuthStateChanged(auth, setUser);
  }, []);

  // FIX: Handle URL parameters for QR code scanning
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scannedTeamId = params.get("team");
    const scannedTenantId = params.get("tenant");
    
    if (scannedTeamId) {
      setActiveTeamId(scannedTeamId);
    }
    
    // IMPORTANT: Set activeAppId from URL if present, BEFORE data fetching starts
    if (scannedTenantId) {
      setActiveAppId(scannedTenantId);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    localStorage.setItem("event_marks_session", JSON.stringify(userData));
    setActiveAppId(userData.dbId || DEFAULT_APP_ID);
    setAdminLoggedIn(true);
    setView("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("event_marks_session");
    setTeams([]);
    setInvigilators([]);
    setSubmissions([]);
    setAuditLogs([]);
    setIsDataLoaded(false);
    setAdminLoggedIn(false);
    setUser(null);
  };

  useEffect(() => {
    const savedSession = localStorage.getItem("event_marks_session");
    if (savedSession && !activeTeamId) {
      const session = JSON.parse(savedSession);
      setActiveAppId(session.dbId || DEFAULT_APP_ID);
      setAdminLoggedIn(true);
    }
  }, [activeTeamId]);

  useEffect(() => {
    if (!user) return;
    // If not logged in as admin AND not in scanning mode (activeTeamId), don't fetch data
    if (!adminLoggedIn && !activeTeamId) return;

    setIsDataLoaded(false);

    // Use activeAppId which is now correctly set from URL params if applicable
    const unsubTeams = onSnapshot(
      query(
        getCollectionRef(activeAppId, "teams"),
        orderBy("createdAt", "desc")
      ),
      (s) => {
        setTeams(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setIsDataLoaded(true);
      }
    );
    const unsubInv = onSnapshot(
      getCollectionRef(activeAppId, "invigilators"),
      (s) => setInvigilators(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubSub = onSnapshot(
      getCollectionRef(activeAppId, "submissions"),
      (s) => setSubmissions(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubLogs = onSnapshot(
      query(
        getCollectionRef(activeAppId, "audit_logs"),
        orderBy("timestamp", "desc")
      ),
      (s) => setAuditLogs(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubRubric = onSnapshot(
      getDocRef(activeAppId, "rubric_config", "main"),
      (docSnap) =>
        setRubric(docSnap.exists() ? docSnap.data().criteria || [] : [])
    );
    const unsubRanking = onSnapshot(
      getDocRef(activeAppId, "ranking_config", "main"),
      (docSnap) =>
        setRankingConfig(docSnap.exists() ? docSnap.data() : { method: "sum" })
    );

    return () => {
      unsubTeams();
      unsubInv();
      unsubSub();
      unsubLogs();
      unsubRubric();
      unsubRanking();
    };
  }, [user, adminLoggedIn, activeAppId, view, activeTeamId]);

  const leaderboard = useMemo(() => {
    const scores = {};
    let globalTotalScore = 0;
    let globalTotalCount = 0;

    submissions.forEach((sub) => {
      if (!scores[sub.teamId])
        scores[sub.teamId] = {
          total: 0,
          count: 0,
          teamName: sub.teamName,
          teamCode: sub.teamCode,
          finalScore: 0,
        };
      scores[sub.teamId].total += sub.totalScore;
      scores[sub.teamId].count += 1;
      globalTotalScore += sub.totalScore;
      globalTotalCount += 1;
    });

    let m =
      rankingConfig?.mValue ||
      (globalTotalCount > 0 ? globalTotalScore / globalTotalCount : 0);
    let C =
      rankingConfig?.cValue ||
      (Object.keys(scores).length > 0
        ? globalTotalCount / Object.keys(scores).length
        : 0);

    return Object.entries(scores)
      .map(([id, d]) => {
        let finalScore = 0;
        if (rankingConfig?.method === "bayesian") {
          const v = d.count;
          const R = v > 0 ? d.total / v : 0;
          if (v + C > 0) finalScore = (v / (v + C)) * R + (C / (v + C)) * m;
        } else {
          finalScore = d.total;
        }
        return { id, ...d, finalScore };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [submissions, rankingConfig]);

  if (activeTeamId)
    return (
      <>
        <ToastContainer
          toasts={toasts}
          removeToast={(id) =>
            setToasts((prev) => prev.filter((t) => t.id !== id))
          }
        />
        <JudgeApp
          teamId={activeTeamId}
          teams={teams}
          rubric={rubric}
          invigilators={invigilators}
          submissions={submissions}
          onExit={() => setActiveTeamId(null)}
          addToast={addToast}
          currentAppId={activeAppId}
          isDataLoaded={isDataLoaded}
        />
      </>
    );

  if (!adminLoggedIn)
    return (
      <>
        <ToastContainer
          toasts={toasts}
          removeToast={(id) =>
            setToasts((prev) => prev.filter((t) => t.id !== id))
          }
        />
        <LoginView onLogin={handleLoginSuccess} addToast={addToast} />
      </>
    );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <ToastContainer
        toasts={toasts}
        removeToast={(id) =>
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }
      />
      <Sidebar
        view={view}
        setView={setView}
        onLogout={handleLogout}
        activeAppId={activeAppId}
      />
      <main className="flex-1 overflow-y-auto p-8 relative">
        {view === "dashboard" && (
          <DashboardView
            teams={teams}
            invigilators={invigilators}
            submissions={submissions}
            leaderboard={leaderboard}
            rankingConfig={rankingConfig}
          />
        )}
        {view === "ranking" && (
          <RankingLogicView
            rankingConfig={rankingConfig}
            setRankingConfig={setRankingConfig}
            submissions={submissions}
            teams={teams}
            addToast={addToast}
            currentAppId={activeAppId}
          />
        )}
        {(view === "settings" || view === "rubric") && (
          <SettingsView
            rubric={rubric}
            setRubric={setRubric}
            addToast={addToast}
            currentAppId={activeAppId}
          />
        )}
        {view === "export" && (
          <ExportView
            submissions={submissions}
            rubric={rubric}
            teams={teams}
            invigilators={invigilators}
            leaderboard={leaderboard}
          />
        )}
        {view === "audit" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold">Audit Logs</h2>
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <Card
                  key={log.id}
                  className="p-4 border-l-4 border-l-slate-400 flex items-start gap-4"
                >
                  <div className="p-2 rounded-full bg-slate-100 text-slate-600">
                    <Activity size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-slate-800 capitalize">
                        {log.action?.replace(/_/g, " ")}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                      {Object.entries(log.details || {}).map(([k, v]) => (
                        <span key={k} className="mr-4">
                          <span className="font-bold text-slate-500">{k}:</span>{" "}
                          {typeof v === "object" ? JSON.stringify(v) : v}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        {view === "participants" && (
          <ParticipantsView
            teams={teams}
            submissions={submissions}
            rubric={rubric}
            addToast={addToast}
            currentAppId={activeAppId}
          />
        )}
        {view === "qr" && (
          <QRCodeManager
            teams={teams}
            onSimulateScan={setActiveTeamId}
            addToast={addToast}
            currentAppId={activeAppId}
          />
        )}
        {view === "invigilators" && (
          <InvigilatorsView
            invigilators={invigilators}
            submissions={submissions}
            rubric={rubric}
            addToast={addToast}
            currentAppId={activeAppId}
          />
        )}
        {view === "submissions" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold">Submissions</h2>
            <Card>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Team</th>
                    <th className="px-6 py-3">Judge</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td className="px-6 py-3 text-slate-400">
                        {formatDate(s.timestamp)}
                      </td>
                      <td className="px-6 py-3 font-bold">{s.teamName}</td>
                      <td className="px-6 py-3 font-mono">{s.invigilatorId}</td>
                      <td className="px-6 py-3 text-right font-bold text-blue-600">
                        {s.totalScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
