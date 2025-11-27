import React, { useState, useEffect } from "react";
import {
  addDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Shield, LogOut, UserPlus, Database, Trash2, Mail, KeyRound, LogIn } from "lucide-react";
import { getCollectionRef, getDocRef, MASTER_SYSTEM_ID } from "../lib/firebase";
import { Card, Button, Input, Modal } from "../components/UIComponents";

const SuperAdminDashboard = ({ onLogout, onAccessDatabase }) => {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    orgName: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    const unsub = onSnapshot(
      getCollectionRef(MASTER_SYSTEM_ID, "system_users"),
      (snap) => {
        setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        console.error("Error fetching clients:", error);
      }
    );
    return () => unsub();
  }, []);

  const createClient = async () => {
    if (!newClient.email || !newClient.password || !newClient.orgName) {
      alert("All fields are required");
      return;
    }
    const uniqueAppId = "event-" + Math.random().toString(36).substr(2, 9);
    try {
      await addDoc(getCollectionRef(MASTER_SYSTEM_ID, "system_users"), {
        ...newClient,
        uniqueAppId: uniqueAppId,
        createdAt: serverTimestamp(),
        role: "client",
      });
      setNewClient({ orgName: "", email: "", password: "" });
      setIsModalOpen(false);
    } catch (e) {
      alert("Error creating client. Check console for permissions.");
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      <div className="bg-slate-900 text-white p-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-500/50 shadow-lg">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Super Admin Console</h1>
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              Database Management System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right mr-4 hidden md:block">
            <p className="text-sm font-bold">Sathyamoorthy</p>
            <p className="text-xs text-slate-400">Super Administrator</p>
          </div>
          <Button
            variant="secondary"
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            onClick={onLogout}
            icon={LogOut}
          >
            Logout
          </Button>
        </div>
      </div>
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Client Databases
            </h2>
            <p className="text-slate-500">
              Manage event organizers and their isolated environments.
            </p>
          </div>
          <Button
            icon={UserPlus}
            onClick={() => setIsModalOpen(true)}
            className="shadow-xl"
          >
            Add New Client
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="p-6 hover:shadow-xl transition-all border-t-4 border-t-blue-600 group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Database size={24} />
                </div>
                <button
                  className="text-slate-300 hover:text-red-500"
                  onClick={() =>
                    deleteDoc(
                      getDocRef(MASTER_SYSTEM_ID, "system_users", client.id)
                    )
                  }
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">
                {client.organizationName}
              </h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail size={14} /> {client.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded w-fit">
                  <KeyRound size={14} /> {client.password}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  DB ID: {client.uniqueAppId}
                </div>
              </div>
              <Button
                onClick={() => onAccessDatabase(client)}
                className="w-full"
                variant="secondary"
                icon={LogIn}
              >
                Access Database
              </Button>
            </Card>
          ))}
          {clients.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-300 rounded-xl text-slate-400">
              <Database size={48} className="mx-auto mb-4 opacity-20" />
              <p>No clients found. Create your first client database.</p>
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Client Database"
      >
        <div className="space-y-4">
          <Input
            label="Organization Name"
            placeholder="e.g. MIT Tech Fest"
            value={newClient.orgName}
            onChange={(e) =>
              setNewClient({ ...newClient, orgName: e.target.value })
            }
          />
          <Input
            label="Login Email"
            placeholder="client@event.com"
            value={newClient.email}
            onChange={(e) =>
              setNewClient({ ...newClient, email: e.target.value })
            }
          />
          <Input
            label="Login Password"
            type="password"
            placeholder="******"
            value={newClient.password}
            onChange={(e) =>
              setNewClient({ ...newClient, password: e.target.value })
            }
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createClient}>Create Database</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;
