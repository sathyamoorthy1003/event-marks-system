import React, { useState } from "react";
import { query, where, getDocs } from "firebase/firestore";
import { Shield, Mail, KeyRound } from "lucide-react";
import { getCollectionRef, MASTER_SYSTEM_ID, DEFAULT_APP_ID } from "../lib/firebase";
import { Card, Button, Input } from "../components/UIComponents";

const LoginView = ({ onLogin, addToast }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (
      email.toLowerCase() === "sathyamoorthyc1003@gmail.com" &&
      password === "Prakash@1"
    ) {
      onLogin({ role: "super_admin", name: "Sathyamoorthy" });
      setLoading(false);
      return;
    }
    try {
      const usersRef = getCollectionRef(MASTER_SYSTEM_ID, "system_users");
      const q = query(
        usersRef,
        where("email", "==", email),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        onLogin({
          role: "client",
          name: userData.organizationName || "Client",
          dbId: userData.uniqueAppId,
        });
      } else {
        if (email === "admin@event.com" && password === "admin123") {
          onLogin({ role: "client", name: "Demo Admin", dbId: DEFAULT_APP_ID });
        } else {
          addToast("Invalid credentials", "error");
        }
      }
    } catch (err) {
      console.error(err);
      if (email === "admin@event.com" && password === "admin123") {
        onLogin({ role: "client", name: "Demo Admin", dbId: DEFAULT_APP_ID });
      } else {
        addToast("Login failed. Please check credentials.", "error");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl border-0">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 mx-auto mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">System Access</h1>
          <p className="text-slate-500 mt-1">Event Marks Management</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email ID"
            icon={Mail}
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            icon={KeyRound}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full py-3 text-base" disabled={loading}>
            {loading ? "Verifying..." : "Login"}
          </Button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400">
          Secure Multi-Tenant Environment
        </div>
      </Card>
    </div>
  );
};

export default LoginView;
