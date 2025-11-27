import React, { useState, useEffect, useMemo } from "react";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, X, UserCheck, CheckCircle, Star } from "lucide-react";
import { getCollectionRef } from "../lib/firebase";
import { Card, Button, Input } from "../components/UIComponents";

const JudgeApp = ({
  teamId,
  teams,
  rubric,
  invigilators,
  submissions,
  onExit,
  addToast,
  currentAppId,
  isDataLoaded,
}) => {
  const team = teams.find((t) => t.id === teamId || t.code === teamId);
  const [judgeId, setJudgeId] = useState("");
  const [authenticatedJudge, setAuthenticatedJudge] = useState(null);
  const [scores, setScores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [manualTeamId, setManualTeamId] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    const savedJudge = localStorage.getItem(`judge_auth_${teamId}`);
    if (savedJudge) {
      setAuthenticatedJudge(JSON.parse(savedJudge));
    }
  }, [teamId]);

  useEffect(() => {
    const savedScores = localStorage.getItem(`judge_scores_${teamId}`);
    if (savedScores) {
      setScores(JSON.parse(savedScores));
    }
  }, [teamId]);

  const updateScore = (criterionId, value) => {
    const newScores = { ...scores, [criterionId]: value };
    setScores(newScores);
    localStorage.setItem(`judge_scores_${teamId}`, JSON.stringify(newScores));
  };

  const alreadyScored = useMemo(() => {
    if (!authenticatedJudge || !team) return false;
    return submissions.some(
      (s) =>
        s.teamId === team.id && s.invigilatorId === authenticatedJudge.judgeId
    );
  }, [authenticatedJudge, submissions, team]);

  const verifyJudge = () => {
    const normalizedInput = judgeId.trim().toUpperCase();
    if (invigilators.length === 0 && !isDataLoaded) {
      addToast("System is loading judge data, please wait...", "error");
      return;
    }

    const valid = invigilators.find((i) => i.judgeId === normalizedInput);
    if (valid) {
      if (valid.status === "inactive") {
        addToast("Access Denied: Your ID is inactive.", "error");
      } else {
        setAuthenticatedJudge(valid);
        localStorage.setItem(`judge_auth_${teamId}`, JSON.stringify(valid));
        addToast(`Welcome, ${valid.name}`, "success");
      }
    } else {
      addToast("Invalid Judge ID", "error");
    }
  };

  const submitEvaluation = async () => {
    if (Object.keys(scores).length < rubric.length)
      return addToast("Please fill all criteria.", "error");
    setIsSubmitting(true);
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    try {
      await addDoc(getCollectionRef(currentAppId, "submissions"), {
        teamId: team.id,
        teamName: team.name,
        teamCode: team.code,
        invigilatorId: authenticatedJudge.judgeId,
        scores,
        totalScore: total,
        timestamp: serverTimestamp(),
      });
      await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
        action: "score_submit",
        details: {
          team: team.name,
          judge: authenticatedJudge.judgeId,
          total: total,
        },
        timestamp: serverTimestamp(),
      });
      localStorage.removeItem(`judge_scores_${teamId}`);
      setIsDone(true);
      addToast("Scores Submitted Successfully!", "success");
    } catch (err) {
      console.error(err);
      addToast("Submission failed. Try again.", "error");
    }
    setIsSubmitting(false);
  };

  if (!isDataLoaded && teams.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4">
        <Loader2 size={48} className="animate-spin text-blue-600" />
        <p>Loading Event Data...</p>
      </div>
    );
  }

  if (!team)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <X size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Team Not Found</h2>
        <p className="text-slate-500 mt-2 mb-6">
          The ID "{teamId}" was not found in the database.
        </p>
        {showManualEntry ? (
          <div className="w-full max-w-xs space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <Input
              placeholder="Enter Correct Team ID (e.g. TM-001)"
              value={manualTeamId}
              onChange={(e) => setManualTeamId(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={() =>
                (window.location.href = `?team=${manualTeamId}&tenant=${currentAppId}`)
              }
            >
              Go to Team
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowManualEntry(true)}>
            Enter ID Manually
          </Button>
        )}
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="font-bold text-slate-900">{team.name}</h1>
          <p className="text-xs text-slate-500 font-mono">{team.code}</p>
        </div>
        <button
          onClick={onExit}
          className="p-2 bg-slate-100 rounded-full text-slate-600"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {!authenticatedJudge ? (
          <Card className="p-6 space-y-6 mt-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
                <UserCheck size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Judge Verification
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Enter your ID to start scoring.
              </p>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Judge ID (e.g., JDG001)"
                value={judgeId}
                onChange={(e) => setJudgeId(e.target.value)}
                className="text-center uppercase tracking-widest text-lg"
              />
              <Button onClick={verifyJudge} className="w-full py-3 text-base">
                Verify Identity
              </Button>
            </div>
          </Card>
        ) : isDone || alreadyScored ? (
          <Card className="p-8 text-center mt-10 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Success!</h2>
            <p className="text-slate-600">
              Evaluation for <strong>{team.name}</strong> has been submitted.
            </p>
            <Button variant="secondary" onClick={onExit} className="w-full">
              Return to Home
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg shadow-blue-200">
              <p className="text-blue-100 text-xs font-bold uppercase">
                Current Judge
              </p>
              <p className="font-medium text-lg">
                {authenticatedJudge.name} ({authenticatedJudge.judgeId})
              </p>
            </div>
            <div className="space-y-4">
              {rubric.map((criterion) => (
                <Card key={criterion.id} className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <label className="font-bold text-slate-800 block">
                        {criterion.name}
                      </label>
                      <span className="text-xs text-slate-400">
                        Type:{" "}
                        {criterion.inputType === "stars"
                          ? "Star Rating"
                          : "Score"}
                      </span>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">
                      Max: {criterion.max}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {criterion.inputType === "stars" ? (
                      [...Array(criterion.max)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => updateScore(criterion.id, i + 1)}
                          className={`transition-all transform active:scale-90 ${
                            (scores[criterion.id] || 0) > i
                              ? "text-yellow-400 fill-yellow-400 scale-110"
                              : "text-slate-200 hover:text-slate-300"
                          }`}
                        >
                          <Star
                            size={32}
                            className={
                              (scores[criterion.id] || 0) > i
                                ? "fill-current"
                                : ""
                            }
                          />
                        </button>
                      ))
                    ) : (
                      <div className="w-full flex gap-4 items-center">
                        <input
                          type="range"
                          min="0"
                          max={criterion.max}
                          value={scores[criterion.id] || 0}
                          onChange={(e) =>
                            updateScore(criterion.id, parseInt(e.target.value))
                          }
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="w-16 h-12 border border-slate-300 rounded-lg flex items-center justify-center font-bold text-xl text-slate-900 bg-white">
                          {scores[criterion.id] || 0}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            <div className="sticky bottom-4">
              <Button
                onClick={submitEvaluation}
                disabled={isSubmitting}
                className="w-full py-4 text-lg shadow-xl"
              >
                {isSubmitting ? "Submitting..." : "Submit Score"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JudgeApp;
