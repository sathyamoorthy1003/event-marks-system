import React, { useState, useEffect } from "react";
import { setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { Settings, CheckCircle, Calculator, Save } from "lucide-react";
import { getDocRef, getCollectionRef } from "../lib/firebase";
import { Card, Button, Input } from "../components/UIComponents";

const RankingLogicView = ({
  rankingConfig,
  setRankingConfig,
  submissions,
  teams,
  addToast,
  currentAppId,
}) => {
  const [localConfig, setLocalConfig] = useState({
    method: "bayesian",
    autoCalculate: true,
    cValue: 5,
    mValue: 3.0,
  });
  const [calculatedStats, setCalculatedStats] = useState({ c: 0, m: 0 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (rankingConfig) {
      setLocalConfig((prev) => ({
        ...prev,
        ...rankingConfig,
        cValue: rankingConfig.cValue ?? prev.cValue,
        mValue: rankingConfig.mValue ?? prev.mValue,
        autoCalculate: rankingConfig.autoCalculate ?? prev.autoCalculate,
      }));
    }
  }, [rankingConfig]);

  useEffect(() => {
    if (submissions.length > 0) {
      const totalRatings = submissions.length;
      const totalScoreSum = submissions.reduce(
        (acc, s) => acc + s.totalScore,
        0
      );
      const globalAvgRating = totalScoreSum / totalRatings;
      const teamCounts = {};
      submissions.forEach(
        (s) => (teamCounts[s.teamId] = (teamCounts[s.teamId] || 0) + 1)
      );
      const avgRatingsPerTeam = totalRatings / Object.keys(teamCounts).length;
      setCalculatedStats({
        c: parseFloat(avgRatingsPerTeam.toFixed(2)),
        m: parseFloat(globalAvgRating.toFixed(2)),
      });
    }
  }, [submissions]);

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const configToSave = {
        ...localConfig,
        cValue: localConfig.autoCalculate
          ? calculatedStats.c
          : parseFloat(localConfig.cValue),
        mValue: localConfig.autoCalculate
          ? calculatedStats.m
          : parseFloat(localConfig.mValue),
      };
      await setDoc(
        getDocRef(currentAppId, "ranking_config", "main"),
        configToSave
      );
      await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
        action: "ranking_config_update",
        details: configToSave,
        timestamp: serverTimestamp(),
      });
      addToast("Ranking Logic Updated", "success");
    } catch (e) {
      console.error(e);
      addToast("Error saving configuration", "error");
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Ranking Logic</h2>
        <p className="text-slate-500">
          Configure how the leaderboard ranks participants.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
            <Settings size={20} /> Ranking Method
          </h3>
          <div className="space-y-3">
            <button
              onClick={() =>
                setLocalConfig({ ...localConfig, method: "bayesian" })
              }
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                localConfig.method === "bayesian"
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">
                  Bayesian Weighted Average
                </span>
                {localConfig.method === "bayesian" && (
                  <CheckCircle size={18} className="text-blue-600" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Balances rating volume and score.
              </p>
            </button>
            <button
              onClick={() => setLocalConfig({ ...localConfig, method: "sum" })}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                localConfig.method === "sum"
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">
                  Simple Sum (Total Points)
                </span>
                {localConfig.method === "sum" && (
                  <CheckCircle size={18} className="text-blue-600" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Classic leaderboard.
              </p>
            </button>
          </div>
        </Card>
        <Card className="p-6 bg-slate-900 text-white">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Calculator size={20} /> The Formula
          </h3>
          {localConfig.method === "bayesian" ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg font-mono text-sm text-center overflow-x-auto">
                <p className="text-blue-300 mb-2">Weighted Score = </p>
                <p className="text-lg">
                  ( v / (v + C) ) × R + ( C / (v + C) ) × m
                </p>
              </div>
              <ul className="text-sm space-y-2 text-slate-300">
                <li>
                  <strong className="text-white">v:</strong> Number of ratings.
                </li>
                <li>
                  <strong className="text-white">R:</strong> Average rating.
                </li>
                <li>
                  <strong className="text-white">C:</strong> Minimum ratings
                  threshold.
                </li>
                <li>
                  <strong className="text-white">m:</strong> Global average
                  rating.
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <p className="text-center">Score = Sum of all points.</p>
            </div>
          )}
        </Card>
      </div>
      {localConfig.method === "bayesian" && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">
              Algorithm Parameters
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">
                Auto-Calculate
              </label>
              <button
                onClick={() =>
                  setLocalConfig({
                    ...localConfig,
                    autoCalculate: !localConfig.autoCalculate,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localConfig.autoCalculate ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localConfig.autoCalculate
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-slate-700">
                  C (Threshold)
                </label>
                {localConfig.autoCalculate && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Calculated: {calculatedStats.c}
                  </span>
                )}
              </div>
              <Input
                type="number"
                step="0.1"
                disabled={localConfig.autoCalculate}
                value={
                  localConfig.autoCalculate
                    ? calculatedStats.c ?? 0
                    : localConfig.cValue ?? ""
                }
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, cValue: e.target.value })
                }
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-slate-700">
                  m (Average)
                </label>
                {localConfig.autoCalculate && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Calculated: {calculatedStats.m}
                  </span>
                )}
              </div>
              <Input
                type="number"
                step="0.1"
                disabled={localConfig.autoCalculate}
                value={
                  localConfig.autoCalculate
                    ? calculatedStats.m ?? 0
                    : localConfig.mValue ?? ""
                }
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, mValue: e.target.value })
                }
              />
            </div>
          </div>
        </Card>
      )}
      <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-slate-200 flex justify-end gap-4 z-10">
        <Button onClick={saveConfig} disabled={isSaving} icon={Save}>
          {isSaving ? "Saving..." : "Save Ranking Logic"}
        </Button>
      </div>
    </div>
  );
};

export default RankingLogicView;
